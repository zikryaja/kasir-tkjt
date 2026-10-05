"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const emptyForm = {
  sku: "",
  name: "",
  category_id: "",
  description: "",
  price: "",
  stock: "",
  minimum_stock: "",
  status: "active",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fileInputRef = useRef(null);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data produk."
        );
      }

      setProducts(result.data || []);
    } catch (err) {
      setError(err.message || "Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch("/api/categories", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil kategori."
        );
      }

      setCategories(result.data || []);
    } catch (err) {
      console.error("Category error:", err);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        String(product.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(product.sku || "")
          .toLowerCase()
          .includes(keyword);

      const matchesCategory =
        !categoryFilter ||
        String(product.category_id) === String(categoryFilter);

      const matchesStatus =
        statusFilter === "all" ||
        product.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
  ]);

  function resetImage() {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openCreate() {
    resetImage();

    setEditingId(null);

    setForm({
      ...emptyForm,
      category_id: categories[0]?.id
        ? String(categories[0].id)
        : "",
    });

    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function openEdit(product) {
    resetImage();

    setEditingId(product.id);

    setForm({
      sku: product.sku || "",
      name: product.name || "",
      category_id: product.category_id
        ? String(product.category_id)
        : "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      minimum_stock: product.minimum_stock ?? "",
      status: product.status || "active",
    });

    setImagePreview(product.photo || "");

    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    resetImage();

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";

      setImageFile(null);
      setImagePreview("");

      setError(
        "Format gambar harus JPG, JPEG, atau PNG."
      );

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      event.target.value = "";

      setImageFile(null);
      setImagePreview("");

      setError("Ukuran gambar maksimal 5 MB.");

      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
  }

  async function saveProduct(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!form.name.trim()) {
        throw new Error("Nama produk wajib diisi.");
      }

      if (!form.category_id) {
        throw new Error("Kategori produk wajib dipilih.");
      }

      const formData = new FormData();

      formData.append("sku", form.sku.trim());
      formData.append("name", form.name.trim());
      formData.append(
        "category_id",
        String(form.category_id)
      );
      formData.append(
        "description",
        form.description.trim()
      );
      formData.append(
        "price",
        String(Number(form.price || 0))
      );
      formData.append(
        "stock",
        String(Number(form.stock || 0))
      );
      formData.append(
        "minimum_stock",
        String(Number(form.minimum_stock || 0))
      );

      if (form.status) {
        formData.append("status", form.status);
      }

      if (imageFile) {
        formData.append("photo", imageFile);
      }

      const url = editingId
        ? `/api/products/${editingId}`
        : "/api/products";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menyimpan produk."
        );
      }

      setMessage(
        editingId
          ? "Produk berhasil diperbarui."
          : "Produk berhasil ditambahkan."
      );

      closeModal();

      await loadProducts();
    } catch (err) {
      setError(err.message || "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const product = products.find(
      (item) => item.id === id
    );

    const confirmed = window.confirm(
      `Nonaktifkan produk "${product?.name || "ini"}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/products/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal menonaktifkan produk."
        );
      }

      setMessage("Produk berhasil dinonaktifkan.");

      await loadProducts();
    } catch (err) {
      setError(
        err.message || "Gagal menonaktifkan produk."
      );
    }
  }

  async function handleActivate(id) {
    const product = products.find(
      (item) => item.id === id
    );

    const confirmed = window.confirm(
      `Aktifkan kembali produk "${product?.name || "ini"}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "active",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengaktifkan produk."
        );
      }

      setMessage("Produk berhasil diaktifkan.");

      await loadProducts();
    } catch (err) {
      setError(
        err.message || "Gagal mengaktifkan produk."
      );
    }
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            Katalog
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Produk
          </h1>

          <p className="mt-1 text-sm text-muted">
            Kelola produk, harga, gambar, kategori, dan stok.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          + Tambah Produk
        </button>
      </div>

      {/* ALERT */}
      {message && (
        <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* FILTER */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_160px]">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Cari nama atau SKU..."
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
          />

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua kategori</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">
              Daftar Produk
            </h2>

            <p className="mt-1 text-xs text-muted">
              {filteredProducts.length} produk ditampilkan
            </p>
          </div>

          <button
            onClick={loadProducts}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas hover:text-ink"
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-canvas"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-xl">
              📦
            </div>

            <h3 className="mt-4 font-medium text-ink">
              Produk tidak ditemukan
            </h3>

            <p className="mt-1 text-sm text-muted">
              Coba ubah pencarian atau filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left">
                  <th className="px-5 py-3 font-medium text-muted">
                    Produk
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    SKU
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Kategori
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Harga
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Stok
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-muted">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {filteredProducts.map((product) => {
                  const lowStock =
                    Number(product.stock) <=
                    Number(product.minimum_stock);

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-canvas/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.photo ? (
                            <img
                              src={product.photo}
                              alt={product.name}
                              className="h-11 w-11 rounded-lg border border-line object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-lg">
                              📦
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-ink">
                              {product.name}
                            </p>

                            <p className="text-xs text-muted">
                              ID #{product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-muted">
                        {product.sku || "-"}
                      </td>

                      <td className="px-5 py-4 text-muted">
                        {product.category_name || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-ink">
                        {formatRupiah(product.price)}
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <span
                            className={
                              lowStock
                                ? "font-semibold text-warning"
                                : "text-ink"
                            }
                          >
                            {product.stock}
                          </span>

                          {lowStock && (
                            <p className="text-xs text-warning">
                              Stok rendah
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {product.status === "active" ? (
                          <span className="inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-muted/10 px-2.5 py-1 text-xs font-medium text-muted">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEdit(product)
                            }
                            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas"
                          >
                            Edit
                          </button>

                          {product.status === "active" ? (
                            <button
                              onClick={() =>
                                handleDelete(product.id)
                              }
                              className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleActivate(product.id)
                              }
                              className="rounded-md border border-success/30 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10"
                            >
                              Aktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <button
            aria-label="Tutup modal"
            onClick={closeModal}
            className="fixed inset-0 bg-black/50"
          />

          <div className="relative z-10 my-8 w-full max-w-2xl rounded-xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-semibold text-ink">
                  {editingId
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h2>

                <p className="mt-1 text-xs text-muted">
                  Masukkan informasi produk.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-md p-2 text-muted hover:bg-canvas hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={saveProduct}
              className="space-y-5 p-5"
            >
              {/* FOTO PRODUK */}
              <div>
                <label className="text-sm font-medium text-ink">
                  Foto Produk
                </label>

                <div className="mt-2 flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview produk"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-3xl">
                          📷
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          Belum ada foto
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
                    />

                    <p className="mt-2 text-xs text-muted">
                      JPG, JPEG, atau PNG. Maksimal 5 MB.
                    </p>

                    {imageFile && (
                      <p className="mt-1 text-xs text-success">
                        File dipilih: {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SKU + NAMA */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-ink">
                    SKU
                  </label>

                  <input
                    value={form.sku}
                    onChange={(event) =>
                      updateField(
                        "sku",
                        event.target.value
                      )
                    }
                    placeholder="Contoh: LAP-001"
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">
                    Nama Produk
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Contoh: Laptop ASUS"
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* KATEGORI */}
              <div>
                <label className="text-sm font-medium text-ink">
                  Kategori
                </label>

                <select
                  value={form.category_id}
                  onChange={(event) =>
                    updateField(
                      "category_id",
                      event.target.value
                    )
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  required
                >
                  <option value="">
                    Pilih kategori
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESKRIPSI */}
              <div>
                <label className="text-sm font-medium text-ink">
                  Deskripsi
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Deskripsi produk..."
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              {/* HARGA + STOK */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-ink">
                    Harga
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) =>
                      updateField(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">
                    Stok
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) =>
                      updateField(
                        "stock",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">
                    Minimum Stok
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.minimum_stock}
                    onChange={(event) =>
                      updateField(
                        "minimum_stock",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* STATUS */}
              {editingId && (
                <div>
                  <label className="text-sm font-medium text-ink">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value
                      )
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  >
                    <option value="active">
                      Aktif
                    </option>

                    <option value="inactive">
                      Nonaktif
                    </option>
                  </select>
                </div>
              )}

              {/* FOOTER */}
              <div className="flex justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Mengupload..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Tambah Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}