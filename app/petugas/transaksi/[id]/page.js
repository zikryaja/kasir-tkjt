"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { jsPDF } from "jspdf";

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
  const [downloading, setDownloading] = useState(false);

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

  // =========================================================
  // DOWNLOAD STRUK PDF
  // =========================================================

  const downloadReceipt = () => {
    try {
      setDownloading(true);

      const items = data.items || [];

      /*
       * Tinggi dasar struk.
       * Lebar selalu 80mm.
       */
      let height = 82;

      /*
       * Tambahkan tinggi berdasarkan jumlah produk.
       *
       * Nama produk yang panjang bisa menjadi
       * beberapa baris.
       */
      items.forEach((item) => {
        const productName = String(
          item.product_name || "-"
        );

        const nameLines = Math.max(
          1,
          Math.ceil(productName.length / 28)
        );

        height += 10 + nameLines * 4;
      });

      /*
       * Tambahan:
       * - subtotal
       * - diskon
       * - total
       * - pembayaran
       * - footer
       */
      height += 65;

      /*
       * PDF:
       * width  = 80mm
       * height = dinamis
       */
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, height],
      });

      const centerX = 40;
      const left = 5;
      const right = 75;

      let y = 7;

      // =====================================================
      // HEADER
      // =====================================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(14);

      pdf.text(
        "KASIR TKJT",
        centerX,
        y,
        {
          align: "center",
        }
      );

      y += 5;

      pdf.setFontSize(9);

      pdf.text(
        "SMK Citra Negara",
        centerX,
        y,
        {
          align: "center",
        }
      );

      y += 4;

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(7);

      pdf.text(
        "Sistem Kasir Digital",
        centerX,
        y,
        {
          align: "center",
        }
      );

      y += 6;

      pdf.setLineWidth(0.25);

      pdf.line(
        left,
        y,
        right,
        y
      );

      y += 5;

      // =====================================================
      // INFORMASI TRANSAKSI
      // =====================================================

      pdf.setFontSize(7);

      const infoRow = (
        label,
        value
      ) => {
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          label,
          left,
          y
        );

        pdf.text(
          String(value || "-"),
          right,
          y,
          {
            align: "right",
          }
        );

        y += 4;
      };

      infoRow(
        "No. Transaksi",
        data.invoice_number
      );

      infoRow(
        "Tanggal",
        formatDate(data.created_at)
      );

      infoRow(
        "Kasir",
        data.cashier_name || "-"
      );

      infoRow(
        "Member",
        data.member_name || "Umum"
      );

      y += 2;

      pdf.line(
        left,
        y,
        right,
        y
      );

      y += 5;

      // =====================================================
      // PRODUK
      // =====================================================

      pdf.setFontSize(7);

      items.forEach((item) => {
        const productName = String(
          item.product_name || "-"
        );

        /*
         * Pecah nama produk kalau terlalu panjang.
         */
        const nameLines =
          pdf.splitTextToSize(
            productName,
            70
          );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          nameLines,
          left,
          y
        );

        y +=
          nameLines.length *
          3.5;

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          `${item.quantity} x ${rupiah(
            item.price
          )}`,
          left,
          y
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          rupiah(item.subtotal),
          right,
          y,
          {
            align: "right",
          }
        );

        y += 5;
      });

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.line(
        left,
        y,
        right,
        y
      );

      y += 5;

      // =====================================================
      // RINGKASAN
      // =====================================================

      const summaryRow = (
        label,
        value,
        bold = false
      ) => {
        pdf.setFont(
          "helvetica",
          bold
            ? "bold"
            : "normal"
        );

        pdf.text(
          label,
          left,
          y
        );

        pdf.text(
          value,
          right,
          y,
          {
            align: "right",
          }
        );

        y += bold ? 5 : 4;
      };

      summaryRow(
        "Subtotal",
        rupiah(subtotal)
      );

      if (discount > 0) {
        summaryRow(
          "Diskon Member",
          `- ${rupiah(discount)}`
        );
      }

      summaryRow(
        "TOTAL",
        rupiah(total),
        true
      );

      y += 2;

      pdf.line(
        left,
        y,
        right,
        y
      );

      y += 5;

      // =====================================================
      // PEMBAYARAN
      // =====================================================

      summaryRow(
        "Pembayaran",
        paymentMethod
      );

      if (
        data.payment_method ===
        "cash"
      ) {
        summaryRow(
          "Uang diterima",
          rupiah(paymentAmount)
        );

        summaryRow(
          "Kembalian",
          rupiah(changeAmount)
        );
      }

      y += 2;

      pdf.line(
        left,
        y,
        right,
        y
      );

      y += 6;

      // =====================================================
      // FOOTER
      // =====================================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(8);

      pdf.text(
        "Terima kasih!",
        centerX,
        y,
        {
          align: "center",
        }
      );

      y += 4;

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(7);

      pdf.text(
        "Selamat berbelanja kembali.",
        centerX,
        y,
        {
          align: "center",
        }
      );

      y += 5;

      pdf.setFontSize(6);

      pdf.text(
        "KASIR TKJT · SMK Citra Negara",
        centerX,
        y,
        {
          align: "center",
        }
      );

      // =====================================================
      // DOWNLOAD
      // =====================================================

      pdf.save(
        `${data.invoice_number}.pdf`
      );
    } catch (error) {
      console.error(
        "Gagal membuat PDF:",
        error
      );

      alert(
        "Gagal membuat struk PDF."
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">

      {/* =====================================================
          HEADER
      ====================================================== */}

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

      {/* =====================================================
          TRANSACTION CARD
      ====================================================== */}

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

          {data.payment_method ===
            "cash" && (
            <>
              <div className="mt-2 flex justify-between text-sm">

                <span className="text-muted">
                  Uang diterima
                </span>

                <span>
                  {rupiah(
                    paymentAmount
                  )}
                </span>

              </div>

              <div className="mt-2 flex justify-between text-sm">

                <span className="text-muted">
                  Kembalian
                </span>

                <span>
                  {rupiah(
                    changeAmount
                  )}
                </span>

              </div>
            </>
          )}

        </div>

        {/* ===================================================
            BUTTONS
        ==================================================== */}

        <div className="mt-6 flex gap-2">

          <button
            type="button"
            onClick={downloadReceipt}
            disabled={downloading}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading
              ? "Membuat PDF..."
              : "Unduh Struk PDF"}
          </button>

          <Link
            href="/petugas/transaksi"
            className="flex-1 rounded-lg border border-line px-4 py-3 text-center text-sm font-semibold transition hover:bg-canvas"
          >
            Riwayat
          </Link>

        </div>

      </div>
    </div>
  );
}