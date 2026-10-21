
import db from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";

export async function PUT(req, { params }) {
  const { user, response } = await requireRole("admin");

  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();

    if (!name) {
      return Response.json(
        {
          success: false,
          message: "Nama kategori wajib diisi.",
        },
        { status: 400 }
      );
    }

    const [categories] = await db.execute(
      "SELECT id, name FROM categories WHERE id = ? LIMIT 1",
      [id]
    );

    if (categories.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Kategori tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const [existing] = await db.execute(
      "SELECT id FROM categories WHERE name = ? AND id != ? LIMIT 1",
      [name, id]
    );

    if (existing.length > 0) {
      return Response.json(
        {
          success: false,
          message: "Kategori sudah ada.",
        },
        { status: 409 }
      );
    }

    await db.execute(
      `UPDATE categories
       SET name = ?, description = ?
       WHERE id = ?`,
      [name, description || null, id]
    );

    await db.execute(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES (?, ?, ?)`,
      [
        user.id,
        "UPDATE_CATEGORY",
        `Memperbarui kategori ${categories[0].name} menjadi ${name}`,
      ]
    );

    return Response.json({
      success: true,
      message: "Kategori berhasil diperbarui.",
      data: {
        id: Number(id),
        name,
        description: description || null,
      },
    });
  } catch (error) {
    console.error("Update category error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal memperbarui kategori.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { user, response } = await requireRole("admin");

  if (response) return response;

  try {
    const { id } = await params;

    const [categories] = await db.execute(
      "SELECT id, name FROM categories WHERE id = ? LIMIT 1",
      [id]
    );

    if (categories.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Kategori tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const [products] = await db.execute(
      "SELECT COUNT(*) AS total FROM products WHERE category_id = ?",
      [id]
    );

    if (Number(products[0].total) > 0) {
      return Response.json(
        {
          success: false,
          message: "Kategori masih digunakan oleh produk.",
        },
        { status: 409 }
      );
    }

    await db.execute(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );

    await db.execute(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES (?, ?, ?)`,
      [
        user.id,
        "DELETE_CATEGORY",
        `Menghapus kategori: ${categories[0].name}`,
      ]
    );

    return Response.json({
      success: true,
      message: "Kategori berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal menghapus kategori.",
      },
      { status: 500 }
    );
  }
}
