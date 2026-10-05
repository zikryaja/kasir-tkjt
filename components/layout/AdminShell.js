"use client";

import { useEffect, useState } from "react";
import SidebarNav from "@/components/layout/SidebarNav";
import Topbar from "@/components/layout/Topbar";
import BrandMark from "@/components/layout/BrandMark";
import { BRAND } from "@/lib/brand";

function Brand({ onClose }) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
      <div className="flex items-center gap-3">
        <BrandMark size={32} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">{BRAND.name}</p>
          <p className="text-xs text-sidebar-muted">{BRAND.org}</p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup menu"
          className="rounded-md p-2 text-sidebar-ink hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-sidebar-accent"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function AdminShell({ user, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Tombol Esc menutup drawer (hanya aktif selama drawer terbuka).
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      {/* Sidebar tetap: layar lebar (>= 1024px) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-sidebar lg:flex">
        <Brand />
        <SidebarNav />
      </aside>

      {/* Drawer: layar sempit */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={closeMenu}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar shadow-lg">
            <Brand onClose={closeMenu} />
            <SidebarNav onNavigate={closeMenu} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <Topbar user={user} onOpenMenu={() => setMenuOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}