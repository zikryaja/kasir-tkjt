import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import LoginForm from "@/components/auth/LoginForm";
import BrandMark from "@/components/layout/BrandMark";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Masuk" };

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) redirect("/");

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-canvas">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-5 py-10 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/10 lg:grid-cols-[1.05fr_0.95fr]">
          
          {/* Left branding panel */}
          <section className="relative hidden min-h-[600px] overflow-hidden bg-[#0f1b2d] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
                  <BrandMark size={34} />
                </div>

                <div className="leading-tight">
                  <p className="text-lg font-semibold tracking-tight">
                    {BRAND.name}
                  </p>
                  <p className="text-sm text-white/60">{BRAND.org}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
                Sistem Kasir Digital
              </div>

              <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
                Kelola penjualan dengan lebih
                <span className="text-blue-400"> cepat dan teratur.</span>
              </h2>

              <p className="mt-5 max-w-md text-sm leading-6 text-white/60">
                Satu sistem untuk mengelola produk, transaksi, stok, member,
                laporan, dan aktivitas kasir.
              </p>

              <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                <Feature label="Produk" />
                <Feature label="Transaksi" />
                <Feature label="Laporan" />
              </div>
            </div>

            <p className="relative text-xs text-white/40">
              {BRAND.org} · Kasir Digital
            </p>
          </section>

          {/* Login panel */}
          <section className="flex min-h-[600px] items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-sm">
              {/* Mobile brand */}
              <div className="mb-10 flex items-center gap-3 lg:hidden">
                <BrandMark size={44} />

                <div className="leading-tight">
                  <p className="text-lg font-semibold tracking-tight">
                    {BRAND.name}
                  </p>
                  <p className="text-sm text-muted">{BRAND.org}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-2 text-sm font-medium text-primary">
                  Selamat datang
                </p>

                <h1 className="text-3xl font-semibold tracking-tight text-ink">
                  Masuk ke akun
                </h1>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Masukkan akun kamu untuk melanjutkan ke sistem kasir.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-canvas/50 p-5 sm:p-6">
                <LoginForm />
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-muted">
                Akses sistem diberikan sesuai dengan role akun kamu.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Feature({ label }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="mb-2 h-1.5 w-5 rounded-full bg-blue-400" />
      <p className="text-xs font-medium text-white/70">{label}</p>
    </div>
  );
}