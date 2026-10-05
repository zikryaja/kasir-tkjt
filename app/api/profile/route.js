import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guard";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function PUT(request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo");

    if (!file || typeof file === "string") {
      return Response.json(
        {
          success: false,
          message: "Foto tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    const allowedTypes = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    if (!allowedTypes[file.type]) {
      return Response.json(
        {
          success: false,
          message: "Format foto harus JPG, PNG, atau WebP.",
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        {
          success: false,
          message: "Ukuran foto maksimal 5 MB.",
        },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const extension = allowedTypes[file.type];

    const filename = `${user.id}-${crypto.randomUUID()}.${extension}`;

    const filepath = path.join(
      uploadDir,
      filename
    );

    const bytes = await file.arrayBuffer();

    await fs.writeFile(
      filepath,
      Buffer.from(bytes)
    );

    const photoUrl = `/uploads/profiles/${filename}`;

    // Ambil foto lama
    const [oldRows] = await db.execute(
      "SELECT photo FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );

    const oldPhoto = oldRows[0]?.photo;

    // Simpan foto baru
    await db.execute(
      "UPDATE users SET photo = ? WHERE id = ?",
      [photoUrl, user.id]
    );

    // Hapus foto lama jika berasal dari folder upload kita
    if (
      oldPhoto &&
      oldPhoto.startsWith("/uploads/profiles/")
    ) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        oldPhoto.replace(/^\/+/, "")
      );

      try {
        await fs.unlink(oldPath);
      } catch {
        // File lama tidak ditemukan, abaikan
      }
    }

    return Response.json({
      success: true,
      message: "Foto profil berhasil diperbarui.",
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        photo: photoUrl,
      },
    });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal memperbarui foto profil.",
      },
      { status: 500 }
    );
  }
}