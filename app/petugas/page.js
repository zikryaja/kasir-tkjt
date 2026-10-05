"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function rupiah(v) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}

export default function TransaksiPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRows(j.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-sm text-muted">Riwayat</p>
        <h1 className="mt-1 text-2xl font-semibold">Transaksi Saya</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-canvas text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Pembayaran</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-4 font-medium">{r.invoice_number}</td>
                  <td className="px-5 py-4 text-muted">{r.member_name || "-"}</td>
                  <td className="px-5 py-4">{r.payment_method === "cash" ? "Cash" : "QRIS"}</td>
                  <td className="px-5 py-4 font-semibold">{rupiah(r.total_amount)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link className="font-medium text-primary hover:underline" href={`/petugas/transaksi/${r.id}`}>
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !rows.length && <p className="p-10 text-center text-sm text-muted">Belum ada transaksi.</p>}
        {loading && <p className="p-10 text-center text-sm text-muted">Memuat...</p>}
      </div>
    </div>
  );
}
