import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return Response.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session) {
      return Response.json(
        {
          success: false,
          message: "Session tidak valid atau sudah expired",
        },
        { status: 401 }
      );
    }

    const [rows] = await db.execute(
      `
      SELECT
        id,
        name,
        username,
        role,
        photo
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [Number(session.userId)]
    );

    if (!rows.length) {
      return Response.json(
        {
          success: false,
          message: "User tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const user = rows[0];

    return Response.json({
      success: true,
      data: {
        id: Number(user.id),
        name: user.name,
        username: user.username,
        role: user.role,
        photo: user.photo || "",
      },
    });
  } catch (error) {
    console.error("AUTH ME ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal mengambil data user",
      },
      { status: 500 }
    );
  }
}