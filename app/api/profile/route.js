
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guard";
import cloudinary from "@/lib/cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": true,
  "image/png": true,
  "image/webp": true,
};

async function uploadProfilePhoto(file, userId) {
  if (!file || file.size === 0) {
    throw new Error("Foto tidak ditemukan.");
  }

  if (!ALLOWED_TYPES[file.type]) {
    throw new Error("Format foto harus JPG, PNG, atau WebP.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran foto maksimal 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "kasir-tkjt/profiles",
        public_id: `user-${userId}-${Date.now()}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error("Cloudinary tidak mengembalikan hasil upload."));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });

  return result.secure_url;
}

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

    // Upload foto ke Cloudinary
    const photoUrl = await uploadProfilePhoto(file, user.id);

    // Simpan URL Cloudinary ke database
    const [result] = await db.execute(
      "UPDATE users SET photo = ? WHERE id = ?",
      [photoUrl, user.id]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        {
          success: false,
          message: "Data pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
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

    const message =
      error.message || "Gagal memperbarui foto profil.";

    const isValidationError =
      message === "Foto tidak ditemukan." ||
      message === "Format foto harus JPG, PNG, atau WebP." ||
      message === "Ukuran foto maksimal 5 MB.";

    return Response.json(
      {
        success: false,
        message: isValidationError
          ? message
          : "Gagal mengunggah foto profil. Periksa konfigurasi Cloudinary atau koneksi database.",
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
