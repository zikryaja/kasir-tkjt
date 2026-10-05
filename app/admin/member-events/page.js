"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_purchase: "0",
  start_date: "",
  end_date: "",
  status: "active",
};

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function toInputDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MemberEventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      const query = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/member-events${query}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengambil event.");
      }

      setEvents(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [filter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowModal(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      discount_type: item.discount_type || "percentage",
      discount_value: String(item.discount_value ?? ""),
      minimum_purchase: String(item.minimum_purchase ?? "0"),
      start_date: toInputDateTime(item.start_date),
      end_date: toInputDateTime(item.end_date),
      status: item.status || "active",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  }

  async function saveEvent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        editingId ? `/api/member-events/${editingId}` : "/api/member-events",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            discount_value: Number(form.discount_value || 0),
            minimum_purchase: Number(form.minimum_purchase || 0),
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan event.");
      }

      setShowModal(false);
      setMessage(editingId ? "Event berhasil diperbarui." : "Event berhasil dibuat.");
      await loadEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item) {
    try {
      setError("");
      setMessage("");

      const res = await fetch(`/api/member-events/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          discount_type: item.discount_type,
          discount_value: Number(item.discount_value),
          minimum_purchase: Number(item.minimum_purchase),
          start_date: toInputDateTime(item.start_date),
          end_date: toInputDateTime(item.end_date),
          status: item.status === "active" ? "inactive" : "active",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengubah status.");
      }

      setMessage("Status event berhasil diubah.");
      await loadEvents();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteEvent(item) {
    if (!window.confirm(`Hapus event "${item.name}"?`)) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch(`/api/member-events/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus event.");
      }

      setMessage("Event berhasil dihapus.");
      await loadEvents();
    } catch (e) {
      setError(e.message);
    }
  }

  const activeCount = useMemo(
    () => events.filter((item) => item.status === "active").length,
    [events]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Penjualan</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Event & Promo</h1>
          <p className="mt-1 text-sm text-muted">
            Kelola promo diskon khusus member.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Tambah Event
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs text-muted">Total Event</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{events.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs text-muted">Event Aktif</p>
          <p className="mt-2 text-2xl font-semibold text-green-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs text-muted">Filter</p>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-2 h-9 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none"
          >
            <option value="all">Semua</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">Daftar Event</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Memuat event...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-ink">Belum ada event</p>
            <p className="mt-1 text-sm text-muted">Buat promo pertama untuk member.</p>
            <button
              onClick={openCreate}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Tambah Event
            </button>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {events.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{item.name}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                        item.status === "active"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {item.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-1 text-sm text-muted">{item.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                    <span>
                      Diskon:{" "}
                      <b className="text-ink">
                        {item.discount_type === "percentage"
                          ? `${item.discount_value}%`
                          : rupiah(item.discount_value)}
                      </b>
                    </span>
                    <span>
                      Min. belanja:{" "}
                      <b className="text-ink">{rupiah(item.minimum_purchase)}</b>
                    </span>
                    <span>
                      Periode:{" "}
                      <b className="text-ink">
                        {formatDate(item.start_date)} — {formatDate(item.end_date)}
                      </b>
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(item)}
                    className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
                  >
                    {item.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => deleteEvent(item)}
                    className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-semibold text-ink">
                  {editingId ? "Edit Event" : "Tambah Event"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Promo otomatis dapat digunakan member saat checkout.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-xl text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveEvent} className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Nama Event
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Promo Akhir Tahun"
                  className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Deskripsi
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi promo..."
                  rows={3}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">
                    Jenis Diskon
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">
                    Nilai Diskon
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.discount_type === "percentage" ? "100" : undefined}
                    value={form.discount_value}
                    onChange={(e) =>
                      setForm({ ...form, discount_value: e.target.value })
                    }
                    placeholder={form.discount_type === "percentage" ? "10" : "20000"}
                    className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Minimum Pembelian
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minimum_purchase}
                  onChange={(e) =>
                    setForm({ ...form, minimum_purchase: e.target.value })
                  }
                  placeholder="100000"
                  className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">
                    Mulai
                  </label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">
                    Berakhir
                  </label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
