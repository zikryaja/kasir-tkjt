import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import LoginForm from "@/components/auth/LoginForm";
import BrandMark from "@/components/layout/BrandMark";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "Masuk",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) redirect("/");

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="grid min-h-screen lg:grid-cols-[42%_58%]">

        {/* Branding */}
        <section className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark size={42} />

              <div className="leading-tight">
                <p className="text-base font-semibold">
                  {BRAND.name}
                </p>
                <p className="text-sm text-white/55">
                  {BRAND.org}
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-blue-300">
              Sistem Kasir
            </p>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Kelola penjualan
              <br />
              dengan lebih rapi.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              Satu tempat untuk mengelola transaksi, produk, stok,
              member, dan laporan penjualan TKJT.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{BRAND.name}</span>
            <span>Internal System</span>
          </div>
        </section>

        {/* Login */}
        <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">

          {/* Theme Toggle */}
          <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-[400px]">

            {/* Mobile brand */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <BrandMark size={40} />

              <div className="leading-tight">
                <p className="font-semibold">{BRAND.name}</p>
                <p className="text-sm text-muted">
                  {BRAND.org}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-primary">
                Selamat datang
              </p>

              <h2 className="text-2xl font-semibold tracking-tight">
                Masuk ke akun
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Gunakan akun yang telah terdaftar untuk melanjutkan.
              </p>
            </div>

            <LoginForm />

            <div className="mt-8 border-t border-line pt-5">
              <p className="text-center text-xs leading-5 text-muted">
                Akses sistem hanya untuk pengguna yang memiliki
                akun terdaftar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}