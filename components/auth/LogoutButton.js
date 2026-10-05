"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("logout gagal");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Gagal keluar. Coba lagi.");
      setPending(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-canvas disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {pending ? "Keluar..." : "Keluar"}
      </button>
    </span>
  );
}