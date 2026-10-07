import db from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/guard";
import cloudinary from "@/lib/cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": true,
  "image/png": true,
};

async function uploadProductImage(file) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!ALLOWED_TYPES[file.type]) {
    throw new Error("Format gambar harus JPG, JPEG, atau PNG.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "kasir-tkjt/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });

  return result.secure_url;
}

export async function GET() {
  const { user, response } = await requireAuth();

  if (response) return response;

  // Admin dan Petugas boleh melihat produk
  if (user.role !== "admin" && user.role !== "petugas") {
    return Response.json(
      {
        success: false,
        message: "Forbidden",
      },
      { status: 403 }
    );
  }

  try {
    const [rows] = await db.execute(`
      SELECT
        p.id,
        p.sku,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.description,
        p.price,
        p.stock,
        p.minimum_stock,
        p.photo,
        p.status,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `);

    return Response.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal mengambil data produk.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { response } = await requireRole("admin");

  if (response) return response;

  try {
    const contentType =
      request.headers.get("content-type") || "";

    let sku;
    let name;
    let category_id;
    let description;
    let price;
    let stock;
    let minimum_stock;
    let photo = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      sku = formData.get("sku");
      name = formData.get("name");
      category_id = formData.get("category_id");
      description = formData.get("description");
      price = formData.get("price");
      stock = formData.get("stock");
      minimum_stock = formData.get("minimum_stock");

      const image = formData.get("photo");

      if (image instanceof File && image.size > 0) {
        photo = await uploadProductImage(image);
      }
    } else {
      const body = await request.json();

      sku = body.sku;
      name = body.name;
      category_id = body.category_id;
      description = body.description;
      price = body.price;
      stock = body.stock;
      minimum_stock = body.minimum_stock;
      photo = body.photo || null;
    }

    if (!name || !String(name).trim()) {
      return Response.json(
        {
          success: false,
          message: "Nama produk wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!category_id) {
      return Response.json(
        {
          success: false,
          message: "Kategori produk wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (Number(price || 0) < 0) {
      return Response.json(
        {
          success: false,
          message: "Harga tidak boleh negatif.",
        },
        { status: 400 }
      );
    }

    if (Number(stock || 0) < 0) {
      return Response.json(
        {
          success: false,
          message: "Stok tidak boleh negatif.",
        },
        { status: 400 }
      );
    }

    if (Number(minimum_stock || 0) < 0) {
      return Response.json(
        {
          success: false,
          message: "Minimum stok tidak boleh negatif.",
        },
        { status: 400 }
      );
    }

    const [category] = await db.execute(
      `
      SELECT id
      FROM categories
      WHERE id = ?
      LIMIT 1
      `,
      [Number(category_id)]
    );

    if (category.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Kategori tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    if (sku && String(sku).trim()) {
      const [existingSku] = await db.execute(
        `
        SELECT id
        FROM products
        WHERE sku = ?
        LIMIT 1
        `,
        [String(sku).trim()]
      );

      if (existingSku.length > 0) {
        return Response.json(
          {
            success: false,
            message: "SKU sudah digunakan.",
          },
          { status: 409 }
        );
      }
    }

    const [result] = await db.execute(
      `
      INSERT INTO products (
        sku,
        name,
        category_id,
        description,
        price,
        stock,
        minimum_stock,
        photo,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `,
      [
        sku ? String(sku).trim() : null,
        String(name).trim(),
        Number(category_id),
        description ? String(description).trim() : null,
        Number(price || 0),
        Number(stock || 0),
        Number(minimum_stock || 0),
        photo,
      ]
    );

    return Response.json(
      {
        success: true,
        message: "Produk berhasil ditambahkan.",
        data: {
          id: result.insertId,
          photo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);

    return Response.json(
      {
        success: false,
        message:
          error.message || "Gagal menambahkan produk.",
      },
      { status: 500 }
    );
  }
}