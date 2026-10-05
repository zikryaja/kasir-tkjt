"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TransactionDetail() {
  const params = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransaction() {
      try {
        const response = await fetch(
          `/api/transactions/${params.id}`,
          {
            cache: "no-store",
          }
        );

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(
            json.message || "Gagal mengambil transaksi."
          );
        }

        setData(json.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }

    if (params?.id) {
      loadTransaction();
    }
  }, [params?.id]);

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-5 text-danger">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-sm text-muted">
        Memuat transaksi...
      </div>
    );
  }

  /*
   * =========================================================
   * DATA TRANSAKSI
   * =========================================================
   */

  const calculatedSubtotal = (data.items || []).reduce(
    (total, item) => {
      return (
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0)
      );
    },
    0
  );

  const subtotal = Number(
    data.subtotal ?? calculatedSubtotal
  );

  const discount = Number(
    data.discount_amount || 0
  );

  const total = Number(
    data.total_amount || 0
  );

  const paymentAmount = Number(
    data.payment_amount || 0
  );

  const changeAmount = Number(
    data.change_amount || 0
  );

  const paymentMethod =
    data.payment_method === "cash"
      ? "CASH"
      : "QRIS";

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <>
      {/* =====================================================
          PRINT CSS
      ====================================================== */}

      <style jsx global>{`
        /*
         * Normalnya struk tidak terlihat.
         */
        .receipt-print {
          display: none;
        }

        /*
         * Ukuran kertas thermal.
         *
         * Lebar 80mm.
         * Tinggi dibiarkan mengikuti isi.
         */
        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          /*
           * Halaman browser tetap menggunakan area 80mm.
           */
          html,
          body {
            width: 80mm !important;
            min-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /*
           * Sembunyikan tampilan website
           * tanpa menggunakan display:none.
           */
          body * {
            visibility: hidden !important;
          }

          /*
           * Tampilkan struk dan seluruh isinya.
           */
          .receipt-print,
          .receipt-print * {
            visibility: visible !important;
          }

          /*
           * Struk menjadi satu-satunya area yang dicetak.
           */
          .receipt-print {
            display: block !important;

            position: absolute !important;

            left: 0 !important;
            top: 0 !important;

            width: 80mm !important;

            height: auto !important;
            min-height: 0 !important;

            margin: 0 !important;

            padding: 4mm !important;

            box-sizing: border-box !important;

            background: #ffffff !important;
            color: #000000 !important;

            font-family:
              Arial,
              Helvetica,
              sans-serif !important;

            font-size: 10px !important;
            line-height: 1.35 !important;
          }

          .receipt-print * {
            color: #000000 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* =====================================================
          TAMPILAN TRANSAKSI NORMAL
      ====================================================== */}

      <div className="mx-auto max-w-3xl">
        {/* Header */}

        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              Transaksi berhasil
            </p>

            <h1 className="mt-1 text-2xl font-semibold">
              {data.invoice_number}
            </h1>
          </div>

          <Link
            href="/petugas/kasir"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Transaksi Baru
          </Link>
        </div>

        {/* Transaction Card */}

        <div className="rounded-xl border border-line bg-surface p-6">
          {/* Informasi */}

          <div className="border-b border-dashed border-line pb-4">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted">
                Kasir
              </span>

              <span className="text-right">
                {data.cashier_name || "-"}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 text-sm">
              <span className="text-muted">
                Member
              </span>

              <span className="text-right">
                {data.member_name || "Umum"}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 text-sm">
              <span className="text-muted">
                Pembayaran
              </span>

              <span className="text-right">
                {paymentMethod}
              </span>
            </div>
          </div>

          {/* Items */}

          <div className="divide-y divide-line">
            {(data.items || []).map(
              (item, index) => (
                <div
                  key={index}
                  className="flex justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {item.product_name}
                    </p>

                    <p className="text-sm text-muted">
                      {item.quantity} ×{" "}
                      {rupiah(item.price)}
                    </p>
                  </div>

                  <p className="shrink-0 font-semibold">
                    {rupiah(item.subtotal)}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Ringkasan */}

          <div className="border-t border-line pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">
                Subtotal
              </span>

              <span>
                {rupiah(subtotal)}
              </span>
            </div>

            {discount > 0 && (
              <div className="mt-2 flex justify-between text-sm text-success">
                <span>
                  Diskon Member
                </span>

                <span>
                  - {rupiah(discount)}
                </span>
              </div>
            )}

            <div className="mt-3 flex justify-between">
              <span className="text-muted">
                Total
              </span>

              <span className="text-xl font-bold">
                {rupiah(total)}
              </span>
            </div>

            {data.payment_method === "cash" && (
              <>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted">
                    Uang diterima
                  </span>

                  <span>
                    {rupiah(paymentAmount)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted">
                    Kembalian
                  </span>

                  <span>
                    {rupiah(changeAmount)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Tombol */}

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 rounded-lg border border-line px-4 py-3 text-sm font-semibold transition hover:bg-canvas"
            >
              Cetak Struk
            </button>

            <Link
              href="/petugas/transaksi"
              className="flex-1 rounded-lg border border-line px-4 py-3 text-center text-sm font-semibold"
            >
              Riwayat
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          STRUK THERMAL 80MM
      ====================================================== */}

      <div className="receipt-print">

        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "17px",
              fontWeight: "700",
              lineHeight: "20px",
            }}
          >
            KASIR TKJT
          </div>

          <div
            style={{
              marginTop: "2px",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            SMK Citra Negara
          </div>

          <div
            style={{
              marginTop: "2px",
              fontSize: "9px",
            }}
          >
            Sistem Kasir Digital
          </div>
        </div>

        {/* GARIS */}

        <div
          style={{
            borderTop: "1px dashed #000",
            margin: "10px 0",
          }}
        />

        {/* INFO TRANSAKSI */}

        <div
          style={{
            fontSize: "10px",
            lineHeight: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span>No. Transaksi</span>

            <span
              style={{
                fontWeight: "700",
                textAlign: "right",
              }}
            >
              {data.invoice_number}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span>Tanggal</span>

            <span>
              {formatDate(data.created_at)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span>Kasir</span>

            <span>
              {data.cashier_name || "-"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span>Member</span>

            <span>
              {data.member_name || "Umum"}
            </span>
          </div>
        </div>

        {/* GARIS */}

        <div
          style={{
            borderTop: "1px dashed #000",
            margin: "10px 0",
          }}
        />

        {/* PRODUK */}

        <div
          style={{
            fontSize: "10px",
          }}
        >
          {(data.items || []).map(
            (item, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "7px",
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    lineHeight: "14px",
                    wordBreak: "break-word",
                  }}
                >
                  {item.product_name}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    lineHeight: "14px",
                  }}
                >
                  <span>
                    {item.quantity} ×{" "}
                    {rupiah(item.price)}
                  </span>

                  <span
                    style={{
                      fontWeight: "700",
                    }}
                  >
                    {rupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        {/* GARIS */}

        <div
          style={{
            borderTop: "1px dashed #000",
            margin: "10px 0",
          }}
        />

        {/* RINGKASAN */}

        <div
          style={{
            fontSize: "10px",
            lineHeight: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              Subtotal
            </span>

            <span>
              {rupiah(subtotal)}
            </span>
          </div>

          {discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                Diskon Member
              </span>

              <span>
                - {rupiah(discount)}
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            <span>
              TOTAL
            </span>

            <span>
              {rupiah(total)}
            </span>
          </div>
        </div>

        {/* GARIS */}

        <div
          style={{
            borderTop: "1px dashed #000",
            margin: "10px 0",
          }}
        />

        {/* PEMBAYARAN */}

        <div
          style={{
            fontSize: "10px",
            lineHeight: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              Pembayaran
            </span>

            <span
              style={{
                fontWeight: "700",
              }}
            >
              {paymentMethod}
            </span>
          </div>

          {data.payment_method === "cash" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  Uang diterima
                </span>

                <span>
                  {rupiah(paymentAmount)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  Kembalian
                </span>

                <span>
                  {rupiah(changeAmount)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* GARIS */}

        <div
          style={{
            borderTop: "1px dashed #000",
            margin: "10px 0",
          }}
        />

        {/* FOOTER */}

        <div
          style={{
            textAlign: "center",
            fontSize: "10px",
            lineHeight: "15px",
          }}
        >
          <div
            style={{
              fontWeight: "700",
            }}
          >
            Terima kasih!
          </div>

          <div
            style={{
              marginTop: "2px",
            }}
          >
            Selamat berbelanja kembali.
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "8px",
            }}
          >
            KASIR TKJT · SMK Citra Negara
          </div>
        </div>

      </div>
    </>
  );
}