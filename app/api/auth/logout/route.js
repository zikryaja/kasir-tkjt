import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";

export async function POST() {
  try {
    const { user } = await requireAuth();
    if (user) {
      await db.execute(
        "UPDATE attendance SET status='offline', logout_at=NOW(), last_seen=NOW() WHERE user_id=? AND status='online'",
        [user.id]
      );
    }
  } catch (error) {
    console.error("Logout attendance update failed:", error);
  }

  const response = NextResponse.json({ success: true, message: "Logout berhasil" });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
