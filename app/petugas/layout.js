import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import PetugasShell from "@/components/petugas/PetugasShell";
import AttendanceHeartbeat from "@/components/auth/AttendanceHeartbeat";

export default async function PetugasLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "petugas") redirect("/akses-ditolak");

  return (
    <>
      <AttendanceHeartbeat />
      <PetugasShell user={user}>{children}</PetugasShell>
    </>
  );
}