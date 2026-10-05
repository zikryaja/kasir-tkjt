import { notFound } from "next/navigation";
import { adminLinks } from "@/lib/navigation";

// Placeholder: hanya menerima URL yang ada di menu. Selain itu 404.
// Saat halaman asli dibuat (mis. app/admin/products/page.js), halaman asli otomatis menang.
export default async function AdminPlaceholder({ params }) {
  const { slug } = await params;
  const item = adminLinks.find((link) => link.href === "/admin/" + slug.join("/"));

  if (!item) notFound();

  return (
    <div className="rounded-md border border-dashed border-line bg-surface p-6">
      <p className="font-medium">{item.label}</p>
      <p className="mt-1 text-sm text-muted">
        Halaman ini belum dibuat. Dikerjakan pada phase berikutnya.
      </p>
    </div>
  );
}