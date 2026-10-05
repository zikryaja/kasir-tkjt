import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import AdminShell from "@/components/layout/AdminShell";

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/akses-ditolak");

  return <AdminShell user={user}>{children}</AdminShell>;
}