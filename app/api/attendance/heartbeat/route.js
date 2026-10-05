import db from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";

export async function POST() {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const [rows] = await db.execute(
      "SELECT id FROM attendance WHERE user_id = ? AND status = 'online' ORDER BY id DESC LIMIT 1",
      [user.id]
    );

    if (rows.length) {
      await db.execute(
        "UPDATE attendance SET last_seen = NOW() WHERE id = ?",
        [rows[0].id]
      );
    } else {
      await db.execute(
        "INSERT INTO attendance (user_id, login_at, last_seen, status) VALUES (?, NOW(), NOW(), 'online')",
        [user.id]
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/attendance/heartbeat", error);
    return Response.json(
      { success: false, message: "Gagal memperbarui status online." },
      { status: 500 }
    );
  }
}
