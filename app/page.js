import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";

// Beranda hanya "pengatur lalu lintas": arahkan sesuai status login dan role.
export default async function Home() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin/dashboard");
  redirect("/petugas/dashboard");
}