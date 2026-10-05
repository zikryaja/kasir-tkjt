import db from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";

export async function GET() {
  const { response } = await requireAuth();

  if (response) return response;

  try {
    // Ringkasan dashboard
    const [[sales]] = await db.execute(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS sales_today,
        COUNT(*) AS transactions_today
      FROM transactions
      WHERE DATE(created_at) = CURDATE()
    `);

    const [[products]] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM products
      WHERE status = 'active'
    `);

    const [[members]] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM members
    `);

    const [lowStock] = await db.execute(`
      SELECT
        id,
        sku,
        name,
        stock,
        minimum_stock
      FROM products
      WHERE status = 'active'
        AND stock <= minimum_stock
      ORDER BY stock ASC
      LIMIT 10
    `);

    // Penjualan 7 hari terakhir
    const [salesChart] = await db.execute(`
      SELECT
        DATE(created_at) AS date,
        COALESCE(SUM(total_amount), 0) AS total
      FROM transactions
      WHERE created_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Transaksi terbaru
    const [recentTransactions] = await db.execute(`
      SELECT
        id,
        invoice_number,
        total_amount,
        payment_method,
        created_at
      FROM transactions
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Produk terlaris
    const [topProducts] = await db.execute(`
      SELECT
        ti.product_id,
        ti.product_name,
        SUM(ti.quantity) AS quantity,
        SUM(ti.subtotal) AS total
      FROM transaction_items ti
      INNER JOIN transactions t
        ON t.id = ti.transaction_id
      GROUP BY ti.product_id, ti.product_name
      ORDER BY quantity DESC
      LIMIT 5
    `);

    return Response.json({
      success: true,
      data: {
        sales_today: Number(sales.sales_today),
        transactions_today: Number(sales.transactions_today),
        active_products: Number(products.total),
        total_members: Number(members.total),
        low_stock: lowStock,

        sales_chart: salesChart.map((item) => ({
          date: item.date,
          total: Number(item.total),
        })),

        recent_transactions: recentTransactions.map((item) => ({
          id: item.id,
          invoice_number: item.invoice_number,
          total_amount: Number(item.total_amount),
          payment_method: item.payment_method,
          created_at: item.created_at,
        })),

        top_products: topProducts.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: Number(item.quantity),
          total: Number(item.total),
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal mengambil dashboard",
      },
      { status: 500 }
    );
  }
}