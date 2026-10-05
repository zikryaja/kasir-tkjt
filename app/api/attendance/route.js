import db from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";

function onlineFromLastSeen(lastSeen) {
  if (!lastSeen) return false;
  const time = new Date(lastSeen).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= 90_000;
}

export async function GET() {
  const { response } = await requireRole("admin");
  if (response) return response;

  try {
    const [rows] = await db.execute(`
      SELECT
        u.id AS user_id,
        u.name,
        u.username,
        u.role,
        u.status AS account_status,
        a.id AS attendance_id,
        a.login_at,
        a.logout_at,
        a.last_seen,
        a.status AS attendance_status
      FROM users u
      LEFT JOIN attendance a ON a.id = (
        SELECT a2.id
        FROM attendance a2
        WHERE a2.user_id = u.id
        ORDER BY a2.id DESC
        LIMIT 1
      )
      WHERE u.role = 'petugas'
      ORDER BY
        CASE
          WHEN a.last_seen IS NOT NULL AND a.last_seen >= (NOW() - INTERVAL 90 SECOND) THEN 0
          ELSE 1
        END,
        u.name ASC
    `);

    const data = rows.map((row) => ({
      ...row,
      status: onlineFromLastSeen(row.last_seen) ? "online" : "offline",
    }));

    return Response.json({
      success: true,
      data,
      summary: {
        total: data.length,
        online: data.filter((item) => item.status === "online").length,
        offline: data.filter((item) => item.status === "offline").length,
      },
    });
  } catch (error) {
    console.error("GET /api/attendance", error);
    return Response.json(
      { success: false, message: "Gagal mengambil data absensi." },
      { status: 500 }
    );
  }
}
