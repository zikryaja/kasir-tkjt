import db from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/guard";

export async function GET(request) {
  const { response } = await requireAuth();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const current = searchParams.get("current") === "1";
    const status = searchParams.get("status");

    let query = `
      SELECT id, name, description, discount_type, discount_value,
             minimum_purchase, start_date, end_date, status,
             created_at, updated_at
      FROM member_events
    `;
    const params = [];
    const where = [];

    if (current) {
      where.push(
        "status = 'active' AND start_date <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR) AND end_date >= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)"
      );
    } else if (status) {
      where.push("status = ?");
      params.push(status);
    }

    if (where.length) query += ` WHERE ${where.join(" AND ")}`;
    query += current
      ? " ORDER BY start_date DESC, created_at DESC LIMIT 1"
      : " ORDER BY start_date DESC, created_at DESC";

    const [rows] = await db.execute(query, params);

    return Response.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        discount_value: Number(row.discount_value),
        minimum_purchase: Number(row.minimum_purchase),
      })),
    });
  } catch (error) {
    console.error("Get member events error:", error);
    return Response.json(
      { success: false, message: "Gagal mengambil data event." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { response } = await requireRole("admin");
  if (response) return response;

  try {
    const body = await request.json();
    const {
      name, description, discount_type, discount_value,
      minimum_purchase, start_date, end_date, status,
    } = body;

    if (!name?.trim()) {
      return Response.json({ success: false, message: "Nama event wajib diisi." }, { status: 400 });
    }

    const discount = Number(discount_value || 0);
    const minimum = Number(minimum_purchase || 0);

    if (!["percentage", "fixed"].includes(discount_type)) {
      return Response.json({ success: false, message: "Jenis diskon tidak valid." }, { status: 400 });
    }

    if (discount <= 0 || (discount_type === "percentage" && discount > 100)) {
      return Response.json({ success: false, message: "Nilai diskon tidak valid." }, { status: 400 });
    }

    if (!start_date || !end_date || new Date(end_date) <= new Date(start_date)) {
      return Response.json({ success: false, message: "Periode event tidak valid." }, { status: 400 });
    }

    const [result] = await db.execute(
      `INSERT INTO member_events
       (name, description, discount_type, discount_value, minimum_purchase,
        start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description?.trim() || null,
        discount_type,
        discount,
        minimum,
        start_date,
        end_date,
        status === "inactive" ? "inactive" : "active",
      ]
    );

    return Response.json(
      { success: true, message: "Event berhasil dibuat.", data: { id: result.insertId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create member event error:", error);
    return Response.json(
      { success: false, message: error.message || "Gagal membuat event." },
      { status: 500 }
    );
  }
}
