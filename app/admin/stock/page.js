"use client";

import { useEffect, useState } from "react";

const movementTypes = [
  { value: "in", label: "Stok Masuk" },
  { value: "out", label: "Stok Keluar" },
  { value: "adjust", label: "Penyesuaian" },
];

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("in");

  const [form, setForm] = useState({
    product_id: "",
    quantity: "",
    note: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, movementsResponse] = await Promise.all([
        fetch("/api/products", {
          cache: "no-store",
        }),
        fetch("/api/stock-movements", {
          cache: "no-store",
        }),
      ]);

      const productsJson = await productsResponse.json();
      const movementsJson = await movementsResponse.json();

      if (!productsResponse.ok || !productsJson.success) {
        throw new Error(
          productsJson.message || "Gagal mengambil data produk."
        );
      }

      if (!movementsResponse.ok || !movementsJson.success) {
        throw new Error(
          movementsJson.message || "Gagal mengambil riwayat stok."
        );
      }

      setProducts(productsJson.data || []);
      setMovements(movementsJson.data || []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.product_id) {
      setError("Produk wajib dipilih.");
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("Jumlah stok harus lebih dari 0.");
      return;
    }

    try {
      setSaving(true);

      let endpoint = "/api/stock/in";

      if (type === "out") {
        endpoint = "/api/stock/out";
      }

      if (type === "adjust") {
        endpoint = "/api/stock/adjust";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: Number(form.product_id),
          quantity: Number(form.quantity),
          note: form.note.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.message || "Gagal memperbarui stok."
        );
      }

      setSuccess(
        json.message ||
          `Stok ${type === "in" ? "masuk" : type === "out" ? "keluar" : "berhasil disesuaikan"}.`
      );

      setForm({
        product_id: "",
        quantity: "",
        note: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  const filteredMovements = movements.filter((movement) => {
    const keyword = search.toLowerCase();

    return (
      String(movement.product_name || "")
        .toLowerCase()
        .includes(keyword) ||
      String(movement.name || "")
        .toLowerCase()
        .includes(keyword) ||
      String(movement.type || movement.movement_type || "")
        .toLowerCase()
        .includes(keyword) ||
      String(movement.note || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  const activeProducts = products.filter(
    (product) => product.status === "active"
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            Katalog
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-ink">
            Stok
          </h1>

          <p className="mt-1 text-sm text-muted">
            Kelola stok masuk, stok keluar, dan penyesuaian stok.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ALERT */}
      {success && (
        <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* CONTENT */}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* FORM */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-ink">
              Update Stok
            </h2>

            <p className="mt-1 text-sm text-muted">
              Pilih jenis perubahan stok.
            </p>
          </div>

          {/* TYPE */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            {movementTypes.map((item) => {
              const active = type === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setType(item.value)}
                  className={
                    active
                      ? "rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
                      : "rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-muted hover:bg-canvas"
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* PRODUCT */}
            <div>
              <label className="text-sm font-medium text-ink">
                Produk
              </label>

              <select
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="">
                  Pilih produk
                </option>

                {activeProducts.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — stok {product.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* QUANTITY */}
            <div>
              <label className="text-sm font-medium text-ink">
                Jumlah
              </label>

              <input
                type="number"
                name="quantity"
                min="1"
                step="1"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Masukkan jumlah"
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            {/* NOTE */}
            <div>
              <label className="text-sm font-medium text-ink">
                Catatan
              </label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder={
                  type === "in"
                    ? "Contoh: Restock dari supplier"
                    : type === "out"
                      ? "Contoh: Barang rusak"
                      : "Contoh: Koreksi stok opname"
                }
                rows={4}
                className="mt-1.5 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Menyimpan..."
                : type === "in"
                  ? "Tambah Stok"
                  : type === "out"
                    ? "Kurangi Stok"
                    : "Sesuaikan Stok"}
            </button>
          </form>
        </section>

        {/* MOVEMENT HISTORY */}
        <section className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="font-semibold text-ink">
                  Riwayat Perubahan Stok
                </h2>

                <p className="mt-1 text-xs text-muted">
                  Semua aktivitas perubahan stok produk.
                </p>
              </div>

              <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
                {filteredMovements.length} data
              </span>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari produk, tipe, atau catatan..."
              className="mt-4 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-lg bg-canvas"
                />
              ))}
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-ink">
                Belum ada riwayat stok
              </p>

              <p className="mt-1 text-xs text-muted">
                Perubahan stok akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left">
                    <th className="px-5 py-3 font-medium text-muted">
                      Produk
                    </th>

                    <th className="px-5 py-3 font-medium text-muted">
                      Tipe
                    </th>

                    <th className="px-5 py-3 font-medium text-muted">
                      Jumlah
                    </th>

                    <th className="px-5 py-3 font-medium text-muted">
                      Catatan
                    </th>

                    <th className="px-5 py-3 font-medium text-muted">
                      Waktu
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line">
                  {filteredMovements.map(
                    (movement, index) => {
                      const movementType =
                        movement.type ||
                        movement.movement_type ||
                        "";

                      return (
                        <tr
                          key={
                            movement.id ||
                            `${movement.product_id}-${index}`
                          }
                          className="hover:bg-canvas"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-ink">
                              {movement.product_name ||
                                movement.name ||
                                `Produk #${movement.product_id}`}
                            </p>

                            {movement.sku && (
                              <p className="mt-0.5 text-xs text-muted">
                                {movement.sku}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <MovementBadge
                              type={movementType}
                            />
                          </td>

                          <td className="px-5 py-4 font-semibold text-ink">
                            {movement.quantity}
                          </td>

                          <td className="max-w-[220px] px-5 py-4 text-muted">
                            {movement.note || "-"}
                          </td>

                          <td className="px-5 py-4 text-xs text-muted">
                            {formatDate(
                              movement.created_at
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MovementBadge({ type }) {
  const normalized = String(type).toUpperCase();

  if (
    normalized === "IN" ||
    normalized === "STOCK_IN"
  ) {
    return (
      <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
        Masuk
      </span>
    );
  }

  if (
    normalized === "OUT" ||
    normalized === "STOCK_OUT"
  ) {
    return (
      <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
        Keluar
      </span>
    );
  }

  if (
    normalized === "SALE" ||
    normalized === "PENJUALAN"
  ) {
    return (
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        Penjualan
      </span>
    );
  }

  return (
    <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
      Adjustment
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}