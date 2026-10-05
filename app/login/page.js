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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size={44} />
          <div className="leading-tight">
            <p className="text-lg font-semibold">{BRAND.name}</p>
            <p className="text-sm text-muted">{BRAND.org}</p>
          </div>
        </div>
        <div className="rounded-md border border-line bg-surface p-6">
          <h1 className="mb-4 text-base font-semibold">Masuk ke akun</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}