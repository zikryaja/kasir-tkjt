
import db from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/guard";

export async function GET() {
  const { response } = await requireAuth();

  if (response) return response;

  try {
    const [data] = await db.execute(`
      SELECT id, name, description, created_at, updated_at
      FROM categories
      ORDER BY name
    `);

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal mengambil data kategori.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const { user, response } = await requireRole("admin");

  if (response) return response;

  try {
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

    const [existing] = await db.execute(
      "SELECT id FROM categories WHERE name = ? LIMIT 1",
      [name]
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

    const [result] = await db.execute(
      `INSERT INTO categories (name, description)
       VALUES (?, ?)`,
      [name, description || null]
    );

    await db.execute(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES (?, ?, ?)`,
      [
        user.id,
        "CREATE_CATEGORY",
        `Membuat kategori: ${name}`,
      ]
    );

    return Response.json(
      {
        success: true,
        message: "Kategori berhasil dibuat.",
        data: {
          id: result.insertId,
          name,
          description: description || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal membuat kategori.",
      },
      { status: 500 }
    );
  }
}
