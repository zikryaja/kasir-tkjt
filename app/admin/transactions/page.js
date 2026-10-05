"use client";

import { useEffect, useState } from "react";

export default function TransactionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/transactions", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal mengambil transaksi.");
      setRows(json.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const invoice = String(r.invoice_number || "").toLowerCase();
    const method = String(r.payment_method || "").toLowerCase();
    return (!q || invoice.includes(q) || method.includes(q)) &&
      (!payment || String(r.payment_method || "").toLowerCase() === payment);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><p className="text-sm font-medium text-primary">Penjualan</p><h1 className="mt-1 text-2xl font-semibold text-ink">Transaksi</h1><p className="mt-1 text-sm text-muted">Riwayat seluruh transaksi penjualan.</p></div>
        <button onClick={load} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink">↻ Refresh</button>
      </div>
      {error && <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line p-5 md:flex-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari invoice atau metode pembayaran..." className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary" />
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary md:w-44">
            <option value="">Semua pembayaran</option><option value="cash">Cash</option><option value="qris">QRIS</option>
          </select>
        </div>
        {loading ? <Loading /> : filtered.length === 0 ? <div className="px-5 py-16 text-center text-sm text-muted">Belum ada transaksi.</div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
            <thead><tr className="border-b border-line bg-canvas text-left">
              <th className="px-5 py-3 text-muted">Invoice</th><th className="px-5 py-3 text-muted">Total</th><th className="px-5 py-3 text-muted">Pembayaran</th><th className="px-5 py-3 text-muted">Member</th><th className="px-5 py-3 text-muted">Waktu</th><th className="px-5 py-3 text-right text-muted">Detail</th>
            </tr></thead>
            <tbody className="divide-y divide-line">{filtered.map((r) => <tr key={r.id} className="hover:bg-canvas">
              <td className="px-5 py-4 font-medium text-ink">{r.invoice_number || `#${r.id}`}</td>
              <td className="px-5 py-4 font-semibold text-ink">{rupiah(r.total_amount)}</td>
              <td className="px-5 py-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{String(r.payment_method || "-").toUpperCase()}</span></td>
              <td className="px-5 py-4 text-muted">{r.member_name || r.member?.name || "-"}</td>
              <td className="px-5 py-4 text-xs text-muted">{formatDate(r.created_at)}</td>
              <td className="px-5 py-4 text-right"><a href={`/admin/transactions/${r.id}`} className="text-primary">Lihat</a></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
function Loading(){return <div className="space-y-3 p-5">{[1,2,3,4].map(i=><div key={i} className="h-12 animate-pulse rounded-lg bg-canvas"/>)}</div>}
function rupiah(v){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v)||0)}
function formatDate(v){if(!v)return "-";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short"}).format(d)}
