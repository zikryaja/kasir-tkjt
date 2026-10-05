import db from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

async function saveProductImage(file) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!ALLOWED_TYPES[file.type]) {
    throw new Error(
      "Format gambar harus JPG, JPEG, atau PNG."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "products"
  );

  await mkdir(uploadDir, {
    recursive: true,
  });

  const extension = ALLOWED_TYPES[file.type];

  const filename =
    `${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}${extension}`;

  const filepath = path.join(
    uploadDir,
    filename
  );

  const buffer = Buffer.from(
    await file.arrayBuffer()
  );

  await writeFile(filepath, buffer);

  return `/uploads/products/${filename}`;
}

export async function GET(request, { params }) {
  const { response } = await requireRole("admin");

  if (response) return response;

  try {
    const { id } = await params;

    const [rows] = await db.execute(
      `
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
      WHERE p.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get product error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal mengambil data produk.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { response } = await requireRole("admin");

  if (response) return response;

  try {
    const { id } = await params;

    const [existingRows] = await db.execute(
      `
      SELECT
        id,
        photo
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingRows.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const existingProduct = existingRows[0];

    const contentType =
      request.headers.get("content-type") || "";

    let sku;
    let name;
    let category_id;
    let description;
    let price;
    let stock;
    let minimum_stock;
    let status;
    let photo = existingProduct.photo;

    /*
     * =====================================================
     * FORM DATA
     * =====================================================
     */
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      sku = formData.get("sku");
      name = formData.get("name");
      category_id = formData.get("category_id");
      description = formData.get("description");
      price = formData.get("price");
      stock = formData.get("stock");
      minimum_stock = formData.get("minimum_stock");
      status = formData.get("status");

      const image = formData.get("photo");

      if (image instanceof File && image.size > 0) {
        photo = await saveProductImage(image);
      }
    }

    /*
     * =====================================================
     * JSON
     * =====================================================
     */
    else {
      const body = await request.json();

      sku = body.sku;
      name = body.name;
      category_id = body.category_id;
      description = body.description;
      price = body.price;
      stock = body.stock;
      minimum_stock = body.minimum_stock;
      status = body.status;

      if (body.photo !== undefined) {
        photo = body.photo;
      }
    }

    /*
     * =====================================================
     * STATUS ONLY
     * =====================================================
     */

    const isStatusOnly =
      status !== undefined &&
      sku === undefined &&
      name === undefined &&
      category_id === undefined &&
      description === undefined &&
      price === undefined &&
      stock === undefined &&
      minimum_stock === undefined;

    if (isStatusOnly) {
      if (
        status !== "active" &&
        status !== "inactive"
      ) {
        return Response.json(
          {
            success: false,
            message: "Status produk tidak valid.",
          },
          { status: 400 }
        );
      }

      await db.execute(
        `
        UPDATE products
        SET status = ?
        WHERE id = ?
        `,
        [status, id]
      );

      return Response.json({
        success: true,
        message:
          status === "active"
            ? "Produk berhasil diaktifkan."
            : "Produk berhasil dinonaktifkan.",
      });
    }

    /*
     * =====================================================
     * VALIDASI
     * =====================================================
     */

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

    if (
      status !== undefined &&
      status !== "active" &&
      status !== "inactive"
    ) {
      return Response.json(
        {
          success: false,
          message: "Status produk tidak valid.",
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * CEK KATEGORI
     * =====================================================
     */

    const [categoryRows] = await db.execute(
      `
      SELECT id
      FROM categories
      WHERE id = ?
      LIMIT 1
      `,
      [Number(category_id)]
    );

    if (categoryRows.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Kategori tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * CEK SKU
     * =====================================================
     */

    if (sku && String(sku).trim()) {
      const [skuRows] = await db.execute(
        `
        SELECT id
        FROM products
        WHERE sku = ?
          AND id != ?
        LIMIT 1
        `,
        [
          String(sku).trim(),
          id,
        ]
      );

      if (skuRows.length > 0) {
        return Response.json(
          {
            success: false,
            message: "SKU sudah digunakan produk lain.",
          },
          { status: 409 }
        );
      }
    }

    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    await db.execute(
      `
      UPDATE products
      SET
        sku = ?,
        name = ?,
        category_id = ?,
        description = ?,
        price = ?,
        stock = ?,
        minimum_stock = ?,
        photo = ?,
        status = COALESCE(?, status)
      WHERE id = ?
      `,
      [
        sku ? String(sku).trim() : null,
        String(name).trim(),
        Number(category_id),
        description
          ? String(description).trim()
          : null,
        Number(price || 0),
        Number(stock || 0),
        Number(minimum_stock || 0),
        photo,
        status ?? null,
        id,
      ]
    );

    return Response.json({
      success: true,
      message: "Produk berhasil diperbarui.",
      data: {
        id: Number(id),
        photo,
      },
    });
  } catch (error) {
    console.error("Update product error:", error);

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Gagal memperbarui produk.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { response } = await requireRole("admin");

  if (response) return response;

  try {
    const { id } = await params;

    const [existing] = await db.execute(
      `
      SELECT id, name, status
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existing.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    await db.execute(
      `
      UPDATE products
      SET status = 'inactive'
      WHERE id = ?
      `,
      [id]
    );

    return Response.json({
      success: true,
      message: "Produk berhasil dinonaktifkan.",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal menonaktifkan produk.",
      },
      { status: 500 }
    );
  }
}