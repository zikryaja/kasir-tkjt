"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/transactions/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal mengambil detail transaksi.");
      setData(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  function printReceipt() {
    window.open(`/api/receipts/${id}`, "_blank", "width=420,height=700");
  }

  if (loading) return <div className="space-y-4"><div className="h-8 w-64 animate-pulse rounded bg-canvas" /><div className="h-72 animate-pulse rounded-xl bg-canvas" /></div>;
  if (error) return <div className="space-y-4"><button onClick={() => router.back()} className="text-sm text-primary">← Kembali</button><div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div></div>;
  if (!data) return null;

  const items = data.items || [];
  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <button onClick={() => router.back()} className="mb-3 text-sm text-primary">← Kembali ke transaksi</button>
          <p className="text-sm font-medium text-primary">Detail Transaksi</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{data.invoice_number || `#${data.id}`}</h1>
          <p className="mt-1 text-sm text-muted">{formatDate(data.created_at)}</p>
        </div>
        <button onClick={printReceipt} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white">Cetak Struk</button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Info label="Total" value={rupiah(data.total_amount)} strong />
        <Info label="Pembayaran" value={String(data.payment_method || "-").toUpperCase()} />
        <Info label="Petugas" value={data.user_name || "-"} />
        <Info label="Member" value={data.member_name || "-"} />
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line p-5">
          <h2 className="font-semibold text-ink">Item Transaksi</h2>
          <p className="mt-1 text-sm text-muted">{totalQty} item</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-line bg-canvas text-left">
              <th className="px-5 py-3 text-muted">Produk</th>
              <th className="px-5 py-3 text-right text-muted">Harga</th>
              <th className="px-5 py-3 text-center text-muted">Qty</th>
              <th className="px-5 py-3 text-right text-muted">Subtotal</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-medium text-ink">{item.product_name || "-"}</td>
                  <td className="px-5 py-4 text-right text-muted">{rupiah(item.price)}</td>
                  <td className="px-5 py-4 text-center text-muted">{item.quantity}</td>
                  <td className="px-5 py-4 text-right font-semibold text-ink">{rupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t border-line bg-canvas">
              <td colSpan="3" className="px-5 py-4 text-right font-medium text-ink">Total</td>
              <td className="px-5 py-4 text-right text-lg font-semibold text-ink">{rupiah(data.total_amount)}</td>
            </tr></tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value, strong }) {
  return <div className="rounded-xl border border-line bg-surface p-5"><p className="text-sm text-muted">{label}</p><p className={`mt-2 ${strong ? "text-xl" : "text-base"} font-semibold text-ink`}>{value}</p></div>;
}
function rupiah(v) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v) || 0); }
function formatDate(v) { if (!v) return "-"; const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(d); }
