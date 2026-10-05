import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username dan password wajib diisi" }, { status: 400 });
    }

    const [rows] = await db.execute(
      "SELECT id,name,username,password,role,status FROM users WHERE username=? LIMIT 1",
      [username]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
      return NextResponse.json({ success: false, message: "Username atau password salah" }, { status: 401 });
    }

    const user = rows[0];
    if (user.status !== "active") {
      return NextResponse.json({ success: false, message: "Akun tidak aktif" }, { status: 403 });
    }

    const token = await createSession(user);

    await db.execute(
      "UPDATE attendance SET status='offline', logout_at=NOW() WHERE user_id=? AND status='online'",
      [user.id]
    );
    await db.execute(
      "INSERT INTO attendance (user_id, login_at, last_seen, status) VALUES (?, NOW(), NOW(), 'online')",
      [user.id]
    );

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("POST /api/auth/login", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
