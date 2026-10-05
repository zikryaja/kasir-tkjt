// Satu-satunya sumber daftar menu admin.
// Dipakai sidebar (menu), topbar (breadcrumb), dan header halaman (judul + deskripsi).
export const adminNav = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    description: "Ringkasan penjualan dan kondisi toko hari ini.",
  },
  {
    group: "Katalog",
    items: [
      { href: "/admin/products", label: "Produk", description: "Kelola produk, harga, dan stok minimum." },
      { href: "/admin/categories", label: "Kategori", description: "Kelompokkan produk agar mudah dicari." },
      { href: "/admin/stock", label: "Stok", description: "Catat stok masuk, keluar, dan penyesuaian." },
    ],
  },
  {
    group: "Penjualan",
    items: [
      { href: "/admin/members", label: "Member", description: "Data pelanggan terdaftar dan riwayat belanjanya." },
      { href: "/admin/transactions", label: "Transaksi", description: "Riwayat transaksi dari seluruh petugas." },
      { href: "/admin/reports", label: "Laporan", description: "Laporan penjualan dan produk per periode." },
    ],
  },
  {
    group: "Sistem",
    items: [
      { href: "/admin/users", label: "Petugas", description: "Kelola akun petugas kasir." },
      { href: "/admin/attendance", label: "Absensi", description: "Status online dan riwayat login petugas." },
      { href: "/admin/activity", label: "Activity Log", description: "Catatan aktivitas penting di sistem." },
    ],
  },
];

// Daftar datar. Tiap menu membawa nama kelompoknya (untuk breadcrumb).
export const adminLinks = adminNav.flatMap((entry) =>
  entry.items ? entry.items.map((item) => ({ ...item, group: entry.group })) : [entry]
);

// Subhalaman ikut dihitung: /admin/products/12 tetap menandai "Produk".
export function findNavItem(pathname, links) {
  return links.find(
    (link) => pathname === link.href || pathname.startsWith(link.href + "/")
  );
}