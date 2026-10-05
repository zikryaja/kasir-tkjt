import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata = { title: "Akses ditolak" };

export default function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-surface p-6">
        <h1 className="text-base font-semibold">Akses ditolak</h1>
        <p className="mt-2 text-sm text-muted">
          Akun Anda tidak punya izin untuk membuka halaman admin.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-primary hover:underline">
            Kembali ke beranda
          </Link>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}