"use client";

import { useEffect, useMemo, useState } from "react";

function formatRupiah(value) {
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
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateShort(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function StatCard({ title, value, description, icon, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-20 w-20 rounded-full opacity-10 blur-2xl ${accent}`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function PaymentBadge({ method }) {
  const isQris = method === "qris";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isQris
          ? "bg-primary-soft text-primary"
          : "bg-success/10 text-success"
      }`}
    >
      {isQris ? "QRIS" : "CASH"}
    </span>
  );
}

function SalesChart({ data }) {
  const chartData = data || [];
  const max = Math.max(...chartData.map((item) => Number(item.total)), 1);

  return (
    <div className="mt-6">
      {!chartData.length ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-canvas text-sm text-muted">
          Belum ada data penjualan.
        </div>
      ) : (
        <>
          <div className="flex h-64 items-end gap-2 sm:gap-4">
            {chartData.map((item) => {
              const value = Number(item.total);
              const height =
                value > 0 ? Math.max((value / max) * 100, 5) : 2;

              return (
                <div
                  key={item.date}
                  className="group flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="relative flex h-full w-full items-end justify-center">
                    <div
                      className="w-full max-w-10 rounded-t-lg bg-primary transition-all duration-300 group-hover:bg-primary-hover"
                      style={{ height: `${height}%` }}
                      title={formatRupiah(value)}
                    />

                    <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block">
                      {formatRupiah(value)}
                    </div>
                  </div>

                  <span className="mt-3 text-xs text-muted">
                    {formatDateShort(item.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-52 animate-pulse rounded bg-line" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-line" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl bg-surface"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-96 animate-pulse rounded-xl bg-surface" />
        <div className="h-96 animate-pulse rounded-xl bg-surface" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data dashboard."
        );
      }

      setData(result.data);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );

  if (loading) return <LoadingDashboard />;

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-surface p-6">
        <h1 className="font-semibold text-danger">
          Gagal memuat dashboard
        </h1>

        <p className="mt-1 text-sm text-muted">{error}</p>

        <button
          onClick={loadDashboard}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const lowStock = data.low_stock || [];
  const topProducts = data.top_products || [];
  const transactions = data.recent_transactions || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            {today}
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Selamat datang di Dashboard 👋
          </h1>

          <p className="mt-1 text-sm text-muted">
            Pantau aktivitas kasir dan kondisi toko hari ini.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-muted">
              Sistem Online
            </span>
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Penjualan Hari Ini"
          value={formatRupiah(data.sales_today)}
          description="Total transaksi hari ini"
          accent="bg-primary"
          icon="Rp"
        />

        <StatCard
          title="Transaksi"
          value={data.transactions_today}
          description="Transaksi hari ini"
          accent="bg-success"
          icon="TRX"
        />

        <StatCard
          title="Produk Aktif"
          value={data.active_products}
          description="Produk tersedia"
          accent="bg-primary"
          icon="PR"
        />

        <StatCard
          title="Total Member"
          value={data.total_members}
          description="Member terdaftar"
          accent="bg-warning"
          icon="MB"
        />
      </div>

      {/* QUICK ACTION */}
      <section className="rounded-xl border border-line bg-surface p-5">
        <SectionHeader
          title="Aksi Cepat"
          description="Akses fitur yang sering digunakan."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/admin/products"
            className="rounded-lg border border-line p-4 transition hover:border-primary hover:bg-primary-soft"
          >
            <p className="font-medium text-ink">＋ Tambah Produk</p>
            <p className="mt-1 text-xs text-muted">
              Tambahkan produk baru
            </p>
          </a>

          <a
            href="/admin/stock"
            className="rounded-lg border border-line p-4 transition hover:border-primary hover:bg-primary-soft"
          >
            <p className="font-medium text-ink">＋ Stok Masuk</p>
            <p className="mt-1 text-xs text-muted">
              Tambahkan stok barang
            </p>
          </a>

          <a
            href="/admin/transactions"
            className="rounded-lg border border-line p-4 transition hover:border-primary hover:bg-primary-soft"
          >
            <p className="font-medium text-ink">▣ Transaksi</p>
            <p className="mt-1 text-xs text-muted">
              Lihat transaksi terbaru
            </p>
          </a>

          <a
            href="/admin/reports"
            className="rounded-lg border border-line p-4 transition hover:border-primary hover:bg-primary-soft"
          >
            <p className="font-medium text-ink">▤ Laporan</p>
            <p className="mt-1 text-xs text-muted">
              Lihat laporan penjualan
            </p>
          </a>
        </div>
      </section>

      {/* CHART + STOCK */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-line bg-surface p-5">
          <SectionHeader
            title="Penjualan 7 Hari Terakhir"
            description="Performa penjualan berdasarkan tanggal."
          />

          <SalesChart data={data.sales_chart} />
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <SectionHeader
            title="Stok Menipis"
            description="Produk yang perlu diperhatikan."
          />

          <div className="mt-5 space-y-4">
            {!lowStock.length ? (
              <div className="rounded-lg bg-success/10 p-4 text-center">
                <p className="text-sm font-medium text-success">
                  Semua stok aman
                </p>

                <p className="mt-1 text-xs text-muted">
                  Tidak ada produk yang berada di bawah stok minimum.
                </p>
              </div>
            ) : (
              lowStock.map((product) => {
                const percentage =
                  product.minimum_stock > 0
                    ? Math.min(
                        (product.stock / product.minimum_stock) * 100,
                        100
                      )
                    : 0;

                return (
                  <div key={product.id}>
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {product.name}
                        </p>

                        <p className="text-xs text-muted">
                          {product.sku}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-danger">
                        {product.stock} pcs
                      </p>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-danger"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="mt-1 text-right text-[11px] text-muted">
                      Minimum {product.minimum_stock}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* BOTTOM */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* TOP PRODUCTS */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <SectionHeader
            title="Produk Terlaris"
            description="Produk dengan jumlah penjualan terbanyak."
          />

          <div className="mt-4 divide-y divide-line">
            {!topProducts.length ? (
              <p className="py-10 text-center text-sm text-muted">
                Belum ada data produk terjual.
              </p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={`${product.product_id}-${product.product_name}`}
                  className="flex items-center gap-3 py-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold text-primary">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {product.product_name}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {product.quantity} unit terjual
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-ink">
                    {formatRupiah(product.total)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* RECENT TRANSACTIONS */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <SectionHeader
            title="Transaksi Terbaru"
            description="Aktivitas transaksi terakhir."
            action={
              <a
                href="/admin/transactions"
                className="text-xs font-medium text-primary hover:underline"
              >
                Lihat semua →
              </a>
            }
          />

          <div className="mt-4 divide-y divide-line">
            {!transactions.length ? (
              <p className="py-10 text-center text-sm text-muted">
                Belum ada transaksi.
              </p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {transaction.invoice_number}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-ink">
                      {formatRupiah(transaction.total_amount)}
                    </p>

                    <div className="mt-1">
                      <PaymentBadge
                        method={transaction.payment_method}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}