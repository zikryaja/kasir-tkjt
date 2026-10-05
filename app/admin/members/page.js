"use client";

import { useEffect, useMemo, useState } from "react";

const emptyMember = {
  name: "",
  phone: "",
};

const emptyPromo = {
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

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [promo, setPromo] = useState(null);

  const [memberForm, setMemberForm] = useState(emptyMember);
  const [promoForm, setPromoForm] = useState(emptyPromo);

  const [editingMemberId, setEditingMemberId] = useState(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [promoLoading, setPromoLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadMembers() {
    try {
      setLoading(true);

      const res = await fetch("/api/members", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengambil data member.");
      }

      setMembers(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPromo() {
    try {
      setPromoLoading(true);

      const res = await fetch("/api/member-events", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengambil promo.");
      }

      const events = Array.isArray(json.data) ? json.data : [];

      // Satu promo global yang sedang aktif.
      // Jika ada beberapa event aktif, gunakan event dengan
      // periode terbaru.
      const activeEvents = events
        .filter((item) => item.status === "active")
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() -
            new Date(a.start_date).getTime()
        );

      setPromo(activeEvents[0] || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setPromoLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
    loadPromo();
  }, []);

  function openCreateMember() {
    setEditingMemberId(null);
    setMemberForm(emptyMember);
    setError("");
    setMessage("");
    setShowMemberModal(true);
  }

  function openEditMember(member) {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name || "",
      phone: member.phone || "",
    });
    setError("");
    setMessage("");
    setShowMemberModal(true);
  }

  async function saveMember(e) {
    e.preventDefault();

    if (!memberForm.name.trim()) {
      setError("Nama member wajib diisi.");
      return;
    }

    if (!memberForm.phone.trim()) {
      setError("Nomor telepon wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await fetch(
        editingMemberId
          ? `/api/members/${editingMemberId}`
          : "/api/members",
        {
          method: editingMemberId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memberForm),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan member.");
      }

      setShowMemberModal(false);
      setMessage(
        editingMemberId
          ? "Member berhasil diperbarui."
          : "Member berhasil ditambahkan."
      );

      await loadMembers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(member) {
    if (!window.confirm(`Hapus member "${member.name}"?`)) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const res = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus member.");
      }

      setMessage("Member berhasil dihapus.");
      await loadMembers();
    } catch (e) {
      setError(e.message);
    }
  }

  function openPromoModal() {
    if (promo) {
      setPromoForm({
        name: promo.name || "",
        description: promo.description || "",
        discount_type: promo.discount_type || "percentage",
        discount_value: String(promo.discount_value ?? ""),
        minimum_purchase: String(promo.minimum_purchase ?? "0"),
        start_date: toInputDateTime(promo.start_date),
        end_date: toInputDateTime(promo.end_date),
        status: promo.status || "active",
      });
    } else {
      setPromoForm({
        ...emptyPromo,
        start_date: "",
        end_date: "",
      });
    }

    setError("");
    setMessage("");
    setShowPromoModal(true);
  }

  async function savePromo(e) {
    e.preventDefault();

    if (!promoForm.name.trim()) {
      setError("Nama promo wajib diisi.");
      return;
    }

    if (!promoForm.start_date || !promoForm.end_date) {
      setError("Tanggal mulai dan berakhir wajib diisi.");
      return;
    }

    try {
      setSavingPromo(true);
      setError("");
      setMessage("");

      const payload = {
        ...promoForm,
        discount_value: Number(promoForm.discount_value || 0),
        minimum_purchase: Number(promoForm.minimum_purchase || 0),
      };

      let res;

      if (promo) {
        res = await fetch(`/api/member-events/${promo.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/member-events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan promo.");
      }

      setShowPromoModal(false);
      setMessage(
        promo
          ? "Event promo berhasil diperbarui."
          : "Event promo berhasil dibuat."
      );

      await loadPromo();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingPromo(false);
    }
  }

  async function togglePromo() {
    if (!promo) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch(`/api/member-events/${promo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: promo.name,
          description: promo.description,
          discount_type: promo.discount_type,
          discount_value: Number(promo.discount_value),
          minimum_purchase: Number(promo.minimum_purchase),
          start_date: toInputDateTime(promo.start_date),
          end_date: toInputDateTime(promo.end_date),
          status: promo.status === "active" ? "inactive" : "active",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengubah status promo.");
      }

      setMessage(
        promo.status === "active"
          ? "Promo berhasil dinonaktifkan."
          : "Promo berhasil diaktifkan."
      );

      await loadPromo();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deletePromo() {
    if (!promo) return;

    if (!window.confirm(`Hapus event "${promo.name}"?`)) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const res = await fetch(`/api/member-events/${promo.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus promo.");
      }

      setPromo(null);
      setMessage("Event promo berhasil dihapus.");
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return members;

    return members.filter(
      (member) =>
        String(member.name || "").toLowerCase().includes(keyword) ||
        String(member.phone || "").toLowerCase().includes(keyword)
    );
  }, [members, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Penjualan</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Member</h1>
          <p className="mt-1 text-sm text-muted">
            Kelola member dan satu event promo yang berlaku untuk seluruh member.
          </p>
        </div>

        <button
          onClick={openCreateMember}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Tambah Member
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

      {/* GLOBAL PROMO */}
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-lg">
                🎉
              </span>
              <div>
                <h2 className="font-semibold text-ink">Event Promo Member</h2>
                <p className="text-xs text-muted">
                  Satu promo global untuk seluruh member.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openPromoModal}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2"
          >
            {promo ? "Edit Promo" : "+ Atur Promo"}
          </button>
        </div>

        {promoLoading ? (
          <div className="p-6 text-sm text-muted">Memuat promo...</div>
        ) : !promo ? (
          <div className="p-6">
            <p className="font-medium text-ink">Belum ada promo aktif</p>
            <p className="mt-1 text-sm text-muted">
              Buat event promo agar semua member bisa mendapatkan potongan saat
              checkout.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{promo.name}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                    promo.status === "active"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {promo.status === "active" ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              {promo.description && (
                <p className="mt-1 text-sm text-muted">{promo.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                <span>
                  Diskon:{" "}
                  <b className="text-ink">
                    {promo.discount_type === "percentage"
                      ? `${promo.discount_value}%`
                      : rupiah(promo.discount_value)}
                  </b>
                </span>

                <span>
                  Min. belanja:{" "}
                  <b className="text-ink">
                    {rupiah(promo.minimum_purchase)}
                  </b>
                </span>

                <span>
                  Periode:{" "}
                  <b className="text-ink">
                    {formatDate(promo.start_date)} —{" "}
                    {formatDate(promo.end_date)}
                  </b>
                </span>
              </div>

              <p className="mt-3 text-xs text-blue-400">
                Promo ini berlaku untuk seluruh member.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                onClick={openPromoModal}
                className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
              >
                Edit
              </button>

              <button
                onClick={togglePromo}
                className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
              >
                {promo.status === "active" ? "Nonaktifkan" : "Aktifkan"}
              </button>

              <button
                onClick={deletePromo}
                className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
              >
                Hapus
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MEMBER LIST */}
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-ink">Daftar Member</h2>
            <p className="mt-1 text-xs text-muted">
              {members.length} member terdaftar.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / nomor..."
              className="h-9 w-full min-w-0 rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none focus:border-blue-500 sm:w-64"
            />

            <button
              onClick={loadMembers}
              className="rounded-lg border border-line px-3 text-sm text-muted hover:bg-surface-2"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted">
            Memuat member...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-ink">
              {search ? "Member tidak ditemukan" : "Belum ada member"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {search
                ? "Coba gunakan kata pencarian lain."
                : "Tambahkan member pertama."}
            </p>

            {!search && (
              <button
                onClick={openCreateMember}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Tambah Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">No. Telepon</th>
                  <th className="px-5 py-3 font-medium">Terdaftar</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-line last:border-0 hover:bg-surface-2/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-500">
                          {String(member.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted">
                            ID #{member.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-muted">
                      {member.phone || "-"}
                    </td>

                    <td className="px-5 py-4 text-muted">
                      {formatDate(member.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditMember(member)}
                          className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteMember(member)}
                          className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
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

      {/* MEMBER MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-semibold text-ink">
                  {editingMemberId ? "Edit Member" : "Tambah Member"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Data member untuk transaksi kasir.
                </p>
              </div>

              <button
                onClick={() => setShowMemberModal(false)}
                className="text-xl text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveMember} className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Nama Member
                </label>
                <input
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Nama lengkap"
                  className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Nomor Telepon
                </label>
                <input
                  value={memberForm.phone}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="08xxxxxxxxxx"
                  className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingMemberId
                    ? "Simpan Perubahan"
                    : "Tambah Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMO MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-semibold text-ink">
                  {promo ? "Edit Event Promo" : "Atur Event Promo"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Promo ini berlaku untuk seluruh member.
                </p>
              </div>

              <button
                onClick={() => setShowPromoModal(false)}
                className="text-xl text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <form onSubmit={savePromo} className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Nama Event
                </label>
                <input
                  value={promoForm.name}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Contoh: Promo Akhir Tahun"
                  className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Deskripsi
                </label>
                <textarea
                  value={promoForm.description}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Deskripsi promo..."
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">
                    Jenis Diskon
                  </label>
                  <select
                    value={promoForm.discount_type}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        discount_type: e.target.value,
                      })
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
                    max={
                      promoForm.discount_type === "percentage"
                        ? "100"
                        : undefined
                    }
                    value={promoForm.discount_value}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        discount_value: e.target.value,
                      })
                    }
                    placeholder={
                      promoForm.discount_type === "percentage"
                        ? "10"
                        : "20000"
                    }
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
                  value={promoForm.minimum_purchase}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      minimum_purchase: e.target.value,
                    })
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
                    value={promoForm.start_date}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        start_date: e.target.value,
                      })
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
                    value={promoForm.end_date}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        end_date: e.target.value,
                      })
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
                  value={promoForm.status}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      status: e.target.value,
                    })
                  }
                  className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-ink outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-400">
                Promo ini bersifat global. Semua member yang dipilih saat
                checkout akan mendapatkan promo jika memenuhi minimum pembelian
                dan periode promo.
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingPromo}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingPromo
                    ? "Menyimpan..."
                    : promo
                    ? "Simpan Perubahan"
                    : "Buat Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
