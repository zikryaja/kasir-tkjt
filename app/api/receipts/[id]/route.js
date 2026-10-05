import db from "@/lib/db";
import { requireAuth } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  const transactionId = Number(id);
  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return Response.json({ success: false, message: "ID transaksi tidak valid" }, { status: 400 });
  }

  try {
    const [[transaction]] = await db.execute(
      `SELECT
        t.id,
        t.invoice_number,
        t.total_amount,
        t.payment_method,
        t.payment_amount,
        t.change_amount,
        t.created_at,
        u.name AS cashier_name,
        m.name AS member_name,
        m.phone AS member_phone
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE t.id = ?
       LIMIT 1`,
      [transactionId]
    );

    if (!transaction) {
      return Response.json({ success: false, message: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const [items] = await db.execute(
      `SELECT product_name, price, quantity, subtotal
       FROM transaction_items
       WHERE transaction_id = ?
       ORDER BY id ASC`,
      [transactionId]
    );

    const pdf = createReceiptPdf(transaction, items);
    const filename = `struk-${transaction.invoice_number || transaction.id}.pdf`;

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Receipt PDF error:", error);
    return Response.json({ success: false, message: "Gagal membuat PDF struk" }, { status: 500 });
  }
}

function createReceiptPdf(transaction, items) {
  // 80mm thermal paper = 226.77pt. Height dibuat cukup panjang agar aman untuk struk biasa.
  const width = 226.77;
  const lines = [];

  const add = (text = "", options = {}) => lines.push({ text: String(text), ...options });
  const rupiah = (value) => `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
  const center = (text) => add(text, { align: "center" });
  const separator = () => add("--------------------------------");
  const date = formatDate(transaction.created_at);

  center("KASIR TKJT", { bold: true });
  center("SMK CITRA NEGARA", { bold: true });
  center("STRUK PEMBELIAN");
  separator();
  add(`No     : ${transaction.invoice_number || `TRX-${transaction.id}`}`);
  add(`Tanggal: ${date}`);
  add(`Kasir  : ${transaction.cashier_name || "-"}`);
  if (transaction.member_name) add(`Member : ${transaction.member_name}`);
  separator();

  for (const item of items) {
    const nameLines = wrapText(item.product_name || "Produk", 30);
    nameLines.forEach((line, index) => {
      if (index === 0) add(line);
      else add(`  ${line}`);
    });
    add(`${item.quantity} x ${rupiah(item.price)}`, { align: "left" });
    add(padLeft(rupiah(item.subtotal), 32), { align: "left" });
  }

  separator();
  add(`TOTAL ${padLeft(rupiah(transaction.total_amount), 26)}`);
  add(`BAYAR ${padLeft(rupiah(transaction.payment_amount), 26)}`);
  add(`KEMBALI ${padLeft(rupiah(transaction.change_amount), 24)}`);
  add(`METODE ${String(transaction.payment_method || "-").toUpperCase()}`);
  separator();
  center("Terima kasih sudah berbelanja!");
  center("Simpan struk ini sebagai bukti transaksi.");

  const top = 560;
  const lineHeight = 12;
  const bottom = 24;
  const height = Math.max(250, top - lines.length * lineHeight + bottom);
  let y = height - 24;

  const content = [];
  content.push("q");
  content.push("0 0 0 rg");
  content.push("BT");
  content.push("/F1 8 Tf");

  for (const line of lines) {
    let x = 12;
    const text = escapePdfText(line.text);
    if (line.align === "center") {
      const estimatedWidth = line.text.length * 4.25;
      x = Math.max(8, (width - estimatedWidth) / 2);
    }
    content.push(`1 0 0 1 ${fmt(x)} ${fmt(y)} Tm`);
    content.push(`(${text}) Tj`);
    y -= lineHeight;
  }

  content.push("ET");
  content.push("Q");

  return buildPdf(width, height, content.join("\n"));
}

function buildPdf(width, height, stream) {
  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(width)} ${fmt(height)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}

function wrapText(value, max) {
  const words = String(value).split(/\s+/);
  const result = [];
  let current = "";
  for (const word of words) {
    if (!current) current = word;
    else if ((current + " " + word).length <= max) current += " " + word;
    else { result.push(current); current = word; }
  }
  if (current) result.push(current);
  return result.length ? result : [""];
}

function padLeft(value, length) {
  const text = String(value);
  return " ".repeat(Math.max(1, length - text.length)) + text;
}

function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function fmt(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "-");
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}
