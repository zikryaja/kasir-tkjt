"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

function rupiah(v) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}

export default function TransactionDetail() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/transactions/${params.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message || "Gagal mengambil transaksi");
        setData(j.data);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <div className="rounded-xl border border-danger/30 bg-danger/5 p-5 text-danger">{error}</div>;
  if (!data) return <div className="text-sm text-muted">Memuat transaksi...</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Transaksi berhasil</p>
          <h1 className="mt-1 text-2xl font-semibold">{data.invoice_number}</h1>
        </div>
        <Link href="/petugas/kasir" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Transaksi Baru
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="border-b border-dashed border-line pb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Kasir</span>
            <span>{data.cashier_name || "-"}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted">Member</span>
            <span>{data.member_name || "Umum"}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted">Pembayaran</span>
            <span>{data.payment_method === "cash" ? "Cash" : "QRIS"}</span>
          </div>
        </div>

        <div className="divide-y divide-line">
          {(data.items || []).map((item, i) => (
            <div key={i} className="flex justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted">{item.quantity} × {rupiah(item.price)}</p>
              </div>
              <p className="font-semibold">{rupiah(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-4">
          <div className="flex justify-between">
            <span className="text-muted">Total</span>
            <span className="text-xl font-bold">{rupiah(data.total_amount)}</span>
          </div>
          {data.payment_method === "cash" && (
            <>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted">Uang diterima</span>
                <span>{rupiah(data.payment_amount)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted">Kembalian</span>
                <span>{rupiah(data.change_amount)}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => window.print()} className="flex-1 rounded-lg border border-line px-4 py-3 text-sm font-semibold">
            Cetak
          </button>
          <Link href="/petugas/transaksi" className="flex-1 rounded-lg border border-line px-4 py-3 text-center text-sm font-semibold">
            Riwayat
          </Link>
        </div>
      </div>
    </div>
  );
}
