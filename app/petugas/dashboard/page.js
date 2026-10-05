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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([fetch("/api/auth/me"), fetch("/api/dashboard")])
      .then(async ([a, b]) => [await a.json(), await b.json()])
      .then(([me, dash]) => {
        if (me.success) setUser(me.data);
        if (dash.success) setData(dash.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-sm text-muted">Dashboard Petugas</p>
        <h1 className="mt-1 text-2xl font-semibold">Halo, {user?.name || "Petugas"}.</h1>
        <p className="mt-1 text-sm text-muted">Siap melayani transaksi hari ini?</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Penjualan Hari Ini", rupiah(data?.sales_today)],
          ["Transaksi Hari Ini", data?.transactions_today || 0],
          ["Produk Aktif", data?.active_products || 0],
          ["Total Member", data?.total_members || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/petugas/kasir" className="rounded-xl border border-line bg-surface p-6 hover:shadow-md">
          <p className="text-sm text-primary font-medium">KASIR</p>
          <h2 className="mt-2 text-xl font-semibold">Mulai Transaksi</h2>
          <p className="mt-1 text-sm text-muted">Pilih produk, masukkan ke keranjang, lalu lakukan pembayaran.</p>
        </Link>

        <Link href="/petugas/member" className="rounded-xl border border-line bg-surface p-6 hover:shadow-md">
          <p className="text-sm text-primary font-medium">PELANGGAN</p>
          <h2 className="mt-2 text-xl font-semibold">Kelola Member</h2>
          <p className="mt-1 text-sm text-muted">Cari atau buat member baru untuk transaksi.</p>
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Transaksi Terbaru</h2>
        </div>
        <div className="divide-y divide-line">
          {data?.recent_transactions?.length ? data.recent_transactions.map((t) => (
            <Link key={t.id} href={`/petugas/transaksi/${t.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-canvas">
              <div>
                <p className="font-medium">{t.invoice_number}</p>
                <p className="text-xs text-muted">{t.payment_method === "cash" ? "Cash" : "QRIS"}</p>
              </div>
              <p className="font-semibold">{rupiah(t.total_amount)}</p>
            </Link>
          )) : (
            <p className="px-5 py-8 text-center text-sm text-muted">Belum ada transaksi.</p>
          )}
        </div>
      </div>
    </div>
  );
}
