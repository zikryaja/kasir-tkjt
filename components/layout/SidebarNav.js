"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav, adminLinks, findNavItem } from "@/lib/navigation";

function NavLink({ item, active, onNavigate }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`relative block rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-sidebar-accent ${
        active
          ? "bg-white/10 font-medium text-white"
          : "text-sidebar-ink hover:bg-white/5 hover:text-white"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sidebar-accent"
        />
      )}
      {item.label}
    </Link>
  );
}

export default function SidebarNav({ onNavigate }) {
  const pathname = usePathname();
  const activeHref = findNavItem(pathname, adminLinks)?.href;

  return (
    <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-3 py-3">
      {adminNav.map((entry) =>
        entry.items ? (
          <div key={entry.group} className="mt-5">
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-sidebar-muted">
              {entry.group}
            </p>
            <ul className="space-y-0.5">
              {entry.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={item.href === activeHref}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul key={entry.href} className="space-y-0.5">
            <li>
              <NavLink
                item={entry}
                active={entry.href === activeHref}
                onNavigate={onNavigate}
              />
            </li>
          </ul>
        )
      )}
    </nav>
  );
}