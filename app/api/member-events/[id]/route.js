import db from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";

export async function PUT(request, { params }) {
  const { response } = await requireRole("admin");
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      discount_type,
      discount_value,
      minimum_purchase,
      start_date,
      end_date,
      status,
    } = body;

    const eventId = Number(id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return Response.json(
        { success: false, message: "ID event tidak valid." },
        { status: 400 }
      );
    }

    const [existing] = await db.execute(
      "SELECT id FROM member_events WHERE id = ? LIMIT 1",
      [eventId]
    );

    if (!existing.length) {
      return Response.json(
        { success: false, message: "Event tidak ditemukan." },
        { status: 404 }
      );
    }

    if (!name?.trim()) {
      return Response.json(
        { success: false, message: "Nama event wajib diisi." },
        { status: 400 }
      );
    }

    if (!["percentage", "fixed"].includes(discount_type)) {
      return Response.json(
        { success: false, message: "Jenis diskon tidak valid." },
        { status: 400 }
      );
    }

    const discount = Number(discount_value || 0);
    const minimum = Number(minimum_purchase || 0);

    if (discount <= 0) {
      return Response.json(
        { success: false, message: "Nilai diskon harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (discount_type === "percentage" && discount > 100) {
      return Response.json(
        { success: false, message: "Diskon persentase maksimal 100%." },
        { status: 400 }
      );
    }

    if (minimum < 0) {
      return Response.json(
        { success: false, message: "Minimum pembelian tidak boleh negatif." },
        { status: 400 }
      );
    }

    if (!start_date || !end_date) {
      return Response.json(
        { success: false, message: "Periode event wajib diisi." },
        { status: 400 }
      );
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return Response.json(
        { success: false, message: "Format tanggal tidak valid." },
        { status: 400 }
      );
    }

    if (end <= start) {
      return Response.json(
        { success: false, message: "Tanggal selesai harus setelah tanggal mulai." },
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE member_events
       SET name = ?, description = ?, discount_type = ?,
           discount_value = ?, minimum_purchase = ?,
           start_date = ?, end_date = ?, status = ?
       WHERE id = ?`,
      [
        name.trim(),
        description?.trim() || null,
        discount_type,
        discount,
        minimum,
        start_date,
        end_date,
        status === "inactive" ? "inactive" : "active",
        eventId,
      ]
    );

    return Response.json({
      success: true,
      message: "Event berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Update member event error:", error);
    return Response.json(
      { success: false, message: error.message || "Gagal memperbarui event." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { response } = await requireRole("admin");
  if (response) return response;

  try {
    const { id } = await params;
    const eventId = Number(id);

    const [existing] = await db.execute(
      "SELECT id FROM member_events WHERE id = ? LIMIT 1",
      [eventId]
    );

    if (!existing.length) {
      return Response.json(
        { success: false, message: "Event tidak ditemukan." },
        { status: 404 }
      );
    }

    await db.execute(
      "DELETE FROM member_events WHERE id = ?",
      [eventId]
    );

    return Response.json({
      success: true,
      message: "Event berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete member event error:", error);
    return Response.json(
      { success: false, message: "Gagal menghapus event." },
      { status: 500 }
    );
  }
}
