"use client";

import { usePathname } from "next/navigation";
import { adminLinks, findNavItem } from "@/lib/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import UserAvatar from "@/components/layout/UserAvatar";

export default function Topbar({ user, onOpenMenu }) {
  const pathname = usePathname();
  const item = findNavItem(pathname, adminLinks);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Buka menu"
        className="-ml-1 rounded-md p-2 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Breadcrumb. Di layar kecil hanya nama halaman yang tampil. */}
      <nav aria-label="Lokasi halaman" className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
        <span className="hidden sm:inline">Admin</span>
        {item?.group && (
          <>
            <span aria-hidden="true" className="hidden sm:inline">/</span>
            <span className="hidden sm:inline">{item.group}</span>
          </>
        )}
        {item && (
          <>
            <span aria-hidden="true" className="hidden sm:inline">/</span>
            <span className="truncate font-medium text-ink">{item.label}</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />

        <div className="hidden h-6 w-px bg-line sm:block" />

        <div className="flex items-center gap-2.5">
          <UserAvatar user={user} />

          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-ink">
              {user.name || user.username}
            </p>

            <p className="text-xs capitalize text-muted">
              {user.role}
            </p>
          </div>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}