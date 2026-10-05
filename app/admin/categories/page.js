"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

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
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return categories;

    return categories.filter((category) => {
      return (
        String(category.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(category.description || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [categories, search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(category) {
    setEditingId(category.id);

    setForm({
      name: category.name || "",
      description: category.description || "",
    });

    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveCategory(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const name = form.name.trim();
      const description = form.description.trim();

      if (!name) {
        throw new Error("Nama kategori wajib diisi.");
      }

      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menyimpan kategori."
        );
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      setMessage(
        editingId
          ? "Kategori berhasil diperbarui."
          : "Kategori berhasil ditambahkan."
      );

      await loadCategories();
    } catch (err) {
      setMessage(err.message || "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    const confirmed = window.confirm(
      `Hapus kategori "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setMessage("");

      const response = await fetch(
        `/api/categories/${category.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menghapus kategori."
        );
      }

      setMessage("Kategori berhasil dihapus.");

      await loadCategories();
    } catch (err) {
      setMessage(err.message || "Gagal menghapus kategori.");
    }
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
            Kategori
          </h1>

          <p className="mt-1 text-sm text-muted">
            Kelompokkan produk agar lebih mudah dikelola dan dicari.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          + Tambah Kategori
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink">
          {message}
        </div>
      )}

      {/* SEARCH */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau deskripsi kategori..."
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
        />
      </section>

      {/* LIST */}
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">
              Daftar Kategori
            </h2>

            <p className="mt-1 text-xs text-muted">
              {filteredCategories.length} kategori ditampilkan
            </p>
          </div>

          <button
            onClick={loadCategories}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas hover:text-ink"
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-canvas"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="font-medium text-danger">
              Gagal memuat kategori
            </p>

            <p className="mt-1 text-sm text-muted">
              {error}
            </p>

            <button
              onClick={loadCategories}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-xl">
              🗂️
            </div>

            <h3 className="mt-4 font-medium text-ink">
              Belum ada kategori
            </h3>

            <p className="mt-1 text-sm text-muted">
              Tambahkan kategori untuk mengelompokkan produk.
            </p>

            <button
              onClick={openCreate}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              + Tambah Kategori
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left">
                  <th className="px-5 py-3 font-medium text-muted">
                    Nama Kategori
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Deskripsi
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Dibuat
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-muted">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-canvas/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold text-primary">
                          {category.name?.charAt(0)?.toUpperCase() ||
                            "?"}
                        </div>

                        <div>
                          <p className="font-medium text-ink">
                            {category.name}
                          </p>

                          <p className="text-xs text-muted">
                            ID #{category.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-md px-5 py-4 text-muted">
                      <p className="truncate">
                        {category.description || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-muted">
                      {category.created_at
                        ? new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "medium",
                          }).format(new Date(category.created_at))
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(category)}
                          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteCategory(category)}
                          className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Tutup modal"
            onClick={closeModal}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative z-10 w-full max-w-lg rounded-xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-semibold text-ink">
                  {editingId
                    ? "Edit Kategori"
                    : "Tambah Kategori"}
                </h2>

                <p className="mt-1 text-xs text-muted">
                  Masukkan informasi kategori.
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
              onSubmit={saveCategory}
              className="space-y-5 p-5"
            >
              <div>
                <label className="text-sm font-medium text-ink">
                  Nama Kategori
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="Contoh: Laptop"
                  className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  required
                />
              </div>

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
                  placeholder="Deskripsi kategori..."
                  rows={4}
                  className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              {message && (
                <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                  {message}
                </div>
              )}

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
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Tambah Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}