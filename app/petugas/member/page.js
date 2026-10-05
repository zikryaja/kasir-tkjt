"use client";

import { useEffect, useState } from "react";

export default function MemberPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/members");
    const j = await r.json();
    if (j.success) setRows(j.data || []);
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || "Gagal membuat member");
      setRows((old) => [j.data, ...old]);
      setForm({ name: "", phone: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-sm text-muted">Pelanggan</p>
        <h1 className="mt-1 text-2xl font-semibold">Member</h1>
        <p className="mt-1 text-sm text-muted">Petugas bisa membuat member baru sebelum atau saat transaksi.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Tambah Member</h2>
          {error && <p className="mt-3 rounded-lg bg-danger/5 p-3 text-sm text-danger">{error}</p>}
          <div className="mt-5 space-y-4">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama member"
              className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm"
            />
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="No. HP"
              className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm"
            />
            <button disabled={saving} className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Member"}
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line px-5 py-4 font-semibold">Daftar Member</div>
          <div className="divide-y divide-line">
            {rows.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted">{m.phone}</p>
                </div>
              </div>
            ))}
            {!rows.length && <p className="p-8 text-center text-sm text-muted">Belum ada member.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
