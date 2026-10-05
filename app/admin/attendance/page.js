"use client";

import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Belum ada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Belum ada";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getOnlineStatus(item) {
  if (typeof item.is_online === "boolean") {
    return item.is_online;
  }

  if (typeof item.online === "boolean") {
    return item.online;
  }

  if (item.status === "online") {
    return true;
  }

  if (item.status === "offline") {
    return false;
  }

  if (!item.last_seen) {
    return false;
  }

  const lastSeen = new Date(item.last_seen).getTime();

  if (Number.isNaN(lastSeen)) {
    return false;
  }

  return Date.now() - lastSeen <= 90 * 1000;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance() {
    try {
      setError("");

      const res = await fetch("/api/attendance", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message || "Gagal mengambil data absensi."
        );
      }

      const data = Array.isArray(json.data)
        ? json.data
        : [];

      setAttendance(data);
    } catch (err) {
      console.error("Attendance error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();

    const interval = setInterval(() => {
      loadAttendance();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const rows = useMemo(() => {
    return attendance.map((item) => ({
      ...item,
      isOnline: getOnlineStatus(item),
    }));
  }, [attendance]);

  const onlineCount = rows.filter(
    (item) => item.isOnline
  ).length;

  const offlineCount = rows.length - onlineCount;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Sistem
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-ink">
              Absensi Petugas
            </h1>

            <p className="mt-1 text-sm text-muted">
              Pantau status dan aktivitas seluruh akun petugas.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAttendance}
            className="inline-flex w-full items-center justify-center rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas sm:w-auto"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">
            Total Petugas
          </p>

          <p className="mt-2 text-2xl font-semibold text-ink">
            {rows.length}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">
            Sedang Online
          </p>

          <p className="mt-2 text-2xl font-semibold text-success">
            {onlineCount}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">
            Offline
          </p>

          <p className="mt-2 text-2xl font-semibold text-muted">
            {offlineCount}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-ink">
              Daftar Absensi
            </h2>

            <p className="mt-1 text-xs text-muted">
              Status diperbarui otomatis setiap 15 detik.
            </p>
          </div>

          <div className="text-sm text-muted">
            {rows.length} akun
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted">
            Memuat data absensi...
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-danger">
              {error}
            </p>

            <button
              type="button"
              onClick={loadAttendance}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-ink">
              Belum ada akun petugas
            </p>

            <p className="mt-1 text-sm text-muted">
              Akun petugas akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-left">
                  <th className="px-5 py-3 font-medium text-muted">
                    Petugas
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Username
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Login Terakhir
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Logout Terakhir
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Terakhir Aktif
                  </th>

                  <th className="px-5 py-3 font-medium text-muted">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => {
                  const name =
                    item.name ||
                    item.user_name ||
                    item.full_name ||
                    "Petugas";

                  const username =
                    item.username ||
                    item.user_username ||
                    "-";

                  const loginAt =
                    item.login_at ||
                    item.last_login ||
                    item.login_time;

                  const logoutAt =
                    item.logout_at ||
                    item.last_logout ||
                    item.logout_time;

                  const lastSeen =
                    item.last_seen ||
                    item.last_active ||
                    item.last_activity;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-line last:border-b-0"
                    >
                      {/* PETUGAS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {getInitials(name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">
                              {name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted">
                              Petugas Kasir
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* USERNAME */}
                      <td className="px-5 py-4 text-muted">
                        @{username}
                      </td>

                      {/* LOGIN */}
                      <td className="px-5 py-4 text-muted">
                        {formatDate(loginAt)}
                      </td>

                      {/* LOGOUT */}
                      <td className="px-5 py-4 text-muted">
                        {formatDate(logoutAt)}
                      </td>

                      {/* LAST SEEN */}
                      <td className="px-5 py-4 text-muted">
                        {formatDate(lastSeen)}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        {item.isOnline ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                            <span className="h-2 w-2 rounded-full bg-success" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-muted/10 px-3 py-1.5 text-xs font-medium text-muted">
                            <span className="h-2 w-2 rounded-full bg-muted" />
                            Offline
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}