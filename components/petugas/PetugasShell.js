"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/petugas/dashboard",
  },
  {
    group: "OPERASIONAL",
    items: [
      {
        label: "Kasir",
        href: "/petugas/kasir",
      },
      {
        label: "Transaksi Saya",
        href: "/petugas/transaksi",
      },
      {
        label: "Member",
        href: "/petugas/member",
      },
    ],
  },
  {
    group: "AKUN",
    items: [
      {
        label: "Profil",
        href: "/petugas/profile",
      },
    ],
  },
];

function getActiveItem(pathname) {
  const allItems = navItems.flatMap((item) =>
    item.items ? item.items : [item]
  );

  return (
    allItems.find(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(item.href + "/")
    ) || null
  );
}

export default function PetugasShell({ children, user }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");

  const activeItem = getActiveItem(pathname);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const json = await res.json();

        if (json?.success && json?.data) {
          setProfilePhoto(json.data.photo || "");
        }
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    function handleProfilePhotoUpdated(event) {
      const photo = event.detail?.photo;

      if (photo) {
        setProfilePhoto(photo);
      }
    }

    window.addEventListener(
      "profile-photo-updated",
      handleProfilePhotoUpdated
    );

    return () => {
      window.removeEventListener(
        "profile-photo-updated",
        handleProfilePhotoUpdated
      );
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const userName = user?.name || "Petugas";
  const userRole = "Petugas";

  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-ink">
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[245px]
          border-r border-sidebar-line
          bg-sidebar
          transition-transform duration-200
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* BRAND */}
        <div className="flex h-[82px] items-center border-b border-sidebar-line px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div>
              <div className="text-[15px] font-semibold text-white">
                Kasir
              </div>

              <div className="text-[11px] text-slate-400">
                SMK Citra Negara
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="h-[calc(100vh-82px)] overflow-y-auto px-4 py-4">
          {navItems.map((section, index) => {
            if (!section.items) {
              const active = pathname === section.href;

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    mb-4 flex h-9 items-center rounded-md
                    border-l-2 px-3 text-sm font-medium
                    transition
                    ${
                      active
                        ? "border-blue-500 bg-white/10 text-white"
                        : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {section.label}
                </Link>
              );
            }

            return (
              <div key={section.group} className="mb-5">
                <div className="mb-2 px-3 text-[11px] font-medium tracking-wide text-slate-500">
                  {section.group}
                </div>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          flex h-9 items-center rounded-md
                          border-l-2 px-3 text-sm font-medium
                          transition
                          ${
                            active
                              ? "border-blue-500 bg-white/10 text-white"
                              : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* MOBILE LOGOUT */}
          <button
            onClick={handleLogout}
            className="mt-4 flex h-9 w-full items-center rounded-md px-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white lg:hidden"
          >
            Keluar
          </button>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="min-h-screen lg:pl-[245px]">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-line bg-background/95 px-5 backdrop-blur lg:px-6">
          {/* LEFT */}
          <div className="flex min-w-0 items-center gap-3">
            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted lg:hidden"
            >
              ☰
            </button>

            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Petugas</span>
              <span className="text-muted">/</span>

              <span className="font-semibold text-ink">
                {activeItem?.label || "Dashboard"}
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {/* THEME */}
            <button
              onClick={() => {
                const current =
                  document.documentElement.dataset.theme;

                const next =
                  current === "dark" ? "light" : "dark";

                document.documentElement.dataset.theme = next;
                localStorage.setItem("kasir-theme", next);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition hover:bg-surface-2"
              title="Ganti tema"
            >
              ☼
            </button>

            {/* PROFILE */}
            <Link
              href="/petugas/profile"
              className="hidden items-center gap-3 sm:flex"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={userName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-400">
                  {initials}
                </div>
              )}

              <div className="hidden leading-tight md:block">
                <div className="text-sm font-semibold text-ink">
                  {userName}
                </div>

                <div className="text-[11px] text-muted">
                  {userRole}
                </div>
              </div>
            </Link>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="hidden h-9 rounded-md border border-line px-4 text-sm font-medium text-ink transition hover:bg-surface-2 sm:block"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="min-h-[calc(100vh-82px)] p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}