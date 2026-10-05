import db from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";

export async function GET() {
  const { response } = await requireAuth();
  if (response) return response;

  try {
    const [rows] = await db.execute(`
      SELECT
        t.id, t.invoice_number, t.user_id, u.name AS user_name,
        t.member_id, m.name AS member_name,
        t.subtotal, t.discount_amount, t.event_id,
        t.total_amount, t.payment_method, t.payment_amount,
        t.change_amount, t.created_at
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN members m ON m.id = t.member_id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);

    return Response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get transactions error:", error);
    return Response.json(
      { success: false, message: "Gagal mengambil transaksi." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const connection = await db.getConnection();

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const memberId = body.member_id ? Number(body.member_id) : null;
    const paymentMethod = body.payment_method;
    const paymentAmount = Number(body.payment_amount || 0);

    if (!items.length || !["cash", "qris"].includes(paymentMethod)) {
      return Response.json({ success: false, message: "Data transaksi tidak valid." }, { status: 400 });
    }

    await connection.beginTransaction();

    if (memberId) {
      const [members] = await connection.execute(
        "SELECT id FROM members WHERE id = ?",
        [memberId]
      );
      if (!members.length) {
        await connection.rollback();
        return Response.json({ success: false, message: "Member tidak ditemukan." }, { status: 400 });
      }
    }

    let subtotal = 0;
    const lines = [];

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
        await connection.rollback();
        return Response.json({ success: false, message: "Item transaksi tidak valid." }, { status: 400 });
      }

      const [products] = await connection.execute(
        `SELECT id, name, price, stock, status
         FROM products WHERE id = ? FOR UPDATE`,
        [productId]
      );

      if (!products.length || products[0].status !== "active") {
        await connection.rollback();
        return Response.json({ success: false, message: "Produk tidak tersedia." }, { status: 400 });
      }

      const product = products[0];

      if (Number(product.stock) < quantity) {
        await connection.rollback();
        return Response.json(
          { success: false, message: `Stok ${product.name} tidak cukup.` },
          { status: 400 }
        );
      }

      const lineSubtotal = Number(product.price) * quantity;
      subtotal += lineSubtotal;
      lines.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity,
        subtotal: lineSubtotal,
      });
    }

    let eventId = null;
    let discountAmount = 0;

    // Global member promo: hanya jika transaksi memiliki member.
    if (memberId) {
      const [events] = await connection.execute(`
        SELECT id, discount_type, discount_value, minimum_purchase
        FROM member_events
        WHERE status = 'active'
          AND start_date <= NOW()
          AND end_date >= NOW()
        ORDER BY start_date DESC, created_at DESC
        LIMIT 1
      `);

      if (events.length && subtotal >= Number(events[0].minimum_purchase)) {
        const event = events[0];
        eventId = event.id;

        discountAmount =
          event.discount_type === "percentage"
            ? subtotal * (Number(event.discount_value) / 100)
            : Number(event.discount_value);

        discountAmount = Math.min(discountAmount, subtotal);
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const totalAmount = Math.max(0, subtotal - discountAmount);

    if (paymentMethod === "cash" && paymentAmount < totalAmount) {
      await connection.rollback();
      return Response.json(
        { success: false, message: "Uang diterima kurang dari total pembayaran." },
        { status: 400 }
      );
    }

    const changeAmount =
      paymentMethod === "cash" ? Math.max(0, paymentAmount - totalAmount) : 0;

    const invoice = `TRX-${Date.now()}`;

    const [result] = await connection.execute(
      `INSERT INTO transactions
       (invoice_number, user_id, member_id, subtotal, discount_amount, event_id,
        total_amount, payment_method, payment_amount, change_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice,
        user.id,
        memberId,
        subtotal,
        discountAmount,
        eventId,
        totalAmount,
        paymentMethod,
        paymentMethod === "cash" ? paymentAmount : totalAmount,
        changeAmount,
      ]
    );

    for (const line of lines) {
      await connection.execute(
        `INSERT INTO transaction_items
         (transaction_id, product_id, product_name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [result.insertId, line.id, line.name, line.price, line.quantity, line.subtotal]
      );

      await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [line.quantity, line.id]
      );

      await connection.execute(
        `INSERT INTO stock_movements
         (product_id, user_id, type, quantity, note)
         VALUES (?, ?, 'SALE', ?, ?)`,
        [line.id, user.id, -line.quantity, `Penjualan ${invoice}`]
      );
    }

    await connection.commit();

    return Response.json(
      {
        success: true,
        message: "Transaksi berhasil dibuat.",
        data: {
          id: result.insertId,
          invoice_number: invoice,
          subtotal,
          discount_amount: discountAmount,
          event_id: eventId,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_amount: paymentMethod === "cash" ? paymentAmount : totalAmount,
          change_amount: changeAmount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error("Create transaction error:", error);
    return Response.json({ success: false, message: "Gagal membuat transaksi." }, { status: 500 });
  } finally {
    connection.release();
  }
}
