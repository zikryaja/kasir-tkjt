"use client";

import { useEffect, useMemo, useState } from "react";

export default function ReportsPage() {
  const [salesRows, setSalesRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function load() {
    try {
      setLoading(true); setError("");
      const query = start && end ? `?from=${start}&to=${end}` : "";
      const [a, b] = await Promise.all([
        fetch(`/api/reports/sales${query}`, { cache: "no-store" }),
        fetch("/api/reports/products", { cache: "no-store" }),
      ]);
      const aj = await a.json(); const bj = await b.json();
      if (!a.ok || !aj.success) throw new Error(aj.message || "Gagal mengambil laporan penjualan.");
      if (!b.ok || !bj.success) throw new Error(bj.message || "Gagal mengambil laporan produk.");
      setSalesRows(Array.isArray(aj.data) ? aj.data : []);
      setProducts(Array.isArray(bj.data) ? bj.data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const sales = salesRows.reduce((s, r) => s + Number(r.total_sales || 0), 0);
    const transactions = salesRows.reduce((s, r) => s + Number(r.transactions || 0), 0);
    return { sales, transactions, average: transactions ? sales / transactions : 0 };
  }, [salesRows]);

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">Penjualan</p><h1 className="mt-1 text-2xl font-semibold text-ink">Laporan</h1><p className="mt-1 text-sm text-muted">Ringkasan penjualan dan produk berdasarkan periode.</p></div>
      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Field label="Dari"><input type="date" value={start} onChange={e => setStart(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary" /></Field>
          <Field label="Sampai"><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary" /></Field>
          <button onClick={load} className="self-end rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white">Terapkan</button>
        </div>
      </section>
      {error && <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
      {loading ? <div className="h-64 animate-pulse rounded-xl bg-canvas" /> : <>
        <div className="grid gap-4 md:grid-cols-3"><Card label="Total Penjualan" value={rupiah(summary.sales)} /><Card label="Total Transaksi" value={summary.transactions} /><Card label="Rata-rata Transaksi" value={rupiah(summary.average)} /></div>
        <section className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line p-5"><h2 className="font-semibold text-ink">Penjualan per Hari</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-b border-line bg-canvas text-left"><th className="px-5 py-3 text-muted">Tanggal</th><th className="px-5 py-3 text-muted">Transaksi</th><th className="px-5 py-3 text-right text-muted">Penjualan</th></tr></thead><tbody className="divide-y divide-line">{salesRows.length ? salesRows.map((r, i) => <tr key={`${r.date}-${i}`}><td className="px-5 py-4 font-medium text-ink">{formatDateOnly(r.date)}</td><td className="px-5 py-4 text-muted">{r.transactions}</td><td className="px-5 py-4 text-right font-semibold text-ink">{rupiah(r.total_sales)}</td></tr>) : <tr><td colSpan="3" className="px-5 py-12 text-center text-muted">Belum ada data penjualan.</td></tr>}</tbody></table></div>
        </section>
        <section className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line p-5"><h2 className="font-semibold text-ink">Produk Terlaris</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-line bg-canvas text-left"><th className="px-5 py-3 text-muted">Produk</th><th className="px-5 py-3 text-muted">Terjual</th><th className="px-5 py-3 text-right text-muted">Total</th></tr></thead><tbody className="divide-y divide-line">{products.length ? products.slice(0, 10).map((p, i) => <tr key={`${p.product_id}-${i}`}><td className="px-5 py-4 font-medium text-ink">{p.product_name || "-"}</td><td className="px-5 py-4 text-muted">{p.quantity_sold ?? 0}</td><td className="px-5 py-4 text-right font-semibold text-ink">{rupiah(p.total_sales)}</td></tr>) : <tr><td colSpan="3" className="px-5 py-12 text-center text-muted">Belum ada data produk.</td></tr>}</tbody></table></div>
        </section>
      </>}
    </div>
  );
}
function Field({ label, children }) { return <div><label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>{children}</div>; }
function Card({ label, value }) { return <div className="rounded-xl border border-line bg-surface p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-ink">{value}</p></div>; }
function rupiah(v) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v) || 0); }
function formatDateOnly(v) { if (!v) return "-"; const d = new Date(`${String(v).slice(0, 10)}T00:00:00`); return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d); }
