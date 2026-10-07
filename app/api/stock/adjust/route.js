import db from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";

export async function POST(request) {
  const { user, response } = await requireRole("admin");

  if (response) return response;

  const connection = await db.getConnection();

  try {
    const body = await request.json();

    /*
    |--------------------------------------------------------------------------
    | DATA REQUEST
    |--------------------------------------------------------------------------
    | new_stock = stok akhir setelah penyesuaian
    */

    const productId = Number(
      body.product_id ?? body.productId
    );

    const newStock = Number(
      body.new_stock ??
      body.stock ??
      body.quantity
    );

    const note =
      typeof body.note === "string" &&
      body.note.trim()
        ? body.note.trim()
        : "Penyesuaian stok";

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return Response.json(
        {
          success: false,
          message: "Produk tidak valid.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(newStock) ||
      newStock < 0
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Jumlah stok akhir harus berupa angka bulat 0 atau lebih.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSACTION
    |--------------------------------------------------------------------------
    */

    await connection.beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | LOCK PRODUCT
    |--------------------------------------------------------------------------
    */

    const [products] = await connection.execute(
      `
      SELECT
        id,
        name,
        sku,
        stock,
        status
      FROM products
      WHERE id = ?
      FOR UPDATE
      `,
      [productId]
    );

    if (products.length === 0) {
      await connection.rollback();

      return Response.json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const product = products[0];

    /*
    |--------------------------------------------------------------------------
    | CHECK ACTIVE
    |--------------------------------------------------------------------------
    */

    if (product.status !== "active") {
      await connection.rollback();

      return Response.json(
        {
          success: false,
          message: "Produk tidak aktif.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULATE DIFFERENCE
    |--------------------------------------------------------------------------
    */

    const previousStock = Number(
      product.stock || 0
    );

    const difference =
      newStock - previousStock;

    /*
    |--------------------------------------------------------------------------
    | NOTHING TO CHANGE
    |--------------------------------------------------------------------------
    */

    if (difference === 0) {
      await connection.rollback();

      return Response.json(
        {
          success: false,
          message:
            "Stok akhir sama dengan stok saat ini. Tidak ada penyesuaian.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PRODUCT STOCK
    |--------------------------------------------------------------------------
    */

    await connection.execute(
      `
      UPDATE products
      SET stock = ?
      WHERE id = ?
      `,
      [
        newStock,
        productId,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | STOCK MOVEMENT
    |--------------------------------------------------------------------------
    |
    | Contoh:
    |
    | 15 -> 16 = +1
    | 15 -> 12 = -3
    |
    */

    await connection.execute(
      `
      INSERT INTO stock_movements
      (
        product_id,
        user_id,
        type,
        quantity,
        note
      )
      VALUES
      (?, ?, 'ADJUSTMENT', ?, ?)
      `,
      [
        productId,
        user.id,
        difference,
        note,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

    await connection.execute(
      `
      INSERT INTO activity_logs
      (
        user_id,
        action,
        description
      )
      VALUES
      (?, ?, ?)
      `,
      [
        user.id,
        "STOCK_ADJUSTMENT",
        `Penyesuaian stok ${product.name}: ${previousStock} menjadi ${newStock} (${difference >= 0 ? "+" : ""}${difference})`,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    await connection.commit();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return Response.json({
      success: true,
      message:
        "Stok berhasil disesuaikan.",
      data: {
        product_id: productId,
        product_name: product.name,
        previous_stock: previousStock,
        new_stock: newStock,
        difference,
        note,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Stock adjustment error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Gagal melakukan penyesuaian stok.",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}