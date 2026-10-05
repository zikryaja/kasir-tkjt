"use client";

import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // LOAD PROFILE
  // =========================
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const json = await res.json();

        console.log("AUTH ME:", json);

        if (!res.ok || !json?.success || !json?.data) {
          throw new Error(
            json?.message || "Gagal mengambil data profil."
          );
        }

        setUser(json.data);
        setPreview(json.data?.photo || "");
      } catch (err) {
        console.error("Profile error:", err);
        setError(
          err.message || "Gagal mengambil data profil."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // =========================
  // SELECT PHOTO
  // =========================
  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Foto harus JPG, PNG, atau WebP.");
      setMessage("");
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      setMessage("");
      setFile(null);
      return;
    }

    setError("");
    setMessage("");
    setFile(selectedFile);

    // Preview foto sebelum upload
    const objectUrl = URL.createObjectURL(selectedFile);

    setPreview(objectUrl);
  }

  // =========================
  // SAVE PHOTO
  // =========================
  async function savePhoto() {
    if (!file) {
      setError("Pilih foto terlebih dahulu.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append("photo", file);

      const res = await fetch("/api/profile", {
        method: "PUT",
        body: formData,
      });

      const json = await res.json();

      console.log("PROFILE UPDATE:", json);

      if (!res.ok || !json?.success) {
        throw new Error(
          json?.message ||
            "Gagal memperbarui foto profil."
        );
      }

      // Update data user
      if (json?.data) {
        setUser((prev) => ({
          ...prev,
          ...json.data,
        }));

        if (json.data.photo) {
          setPreview(json.data.photo);

          // Beritahu Topbar bahwa foto berubah
          window.dispatchEvent(
            new CustomEvent("profile-photo-updated", {
              detail: {
                photo: json.data.photo,
              },
            })
          );
        }
      }

      setFile(null);

      setMessage(
        "Foto profil berhasil diperbarui."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(
        "Save profile error:",
        err
      );

      setError(
        err.message ||
          "Gagal memperbarui foto profil."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">
          Memuat profil...
        </p>
      </div>
    );
  }

  // =========================
  // ERROR LOAD PROFILE
  // =========================
  if (error && !user) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="text-sm text-red-400">
          {error}
        </p>
      </div>
    );
  }

  // =========================
  // INITIAL
  // =========================
  const initials =
    user?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PT";

  return (
    <div className="mx-auto max-w-4xl">
      {/* PAGE HEADER */}
      <div className="mb-6">
        <p className="text-sm text-muted">
          Akun
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-ink">
          Profil
        </h1>

        <p className="mt-1 text-sm text-muted">
          Kelola informasi akun dan foto profil
          petugas.
        </p>
      </div>

      {/* PROFILE CARD */}
      <div className="rounded-xl border border-line bg-surface">
        {/* PROFILE INFORMATION */}
        <div className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* PROFILE PHOTO */}
            <div className="shrink-0">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2">
                {preview ? (
                  <img
                    src={preview}
                    alt="Foto profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-muted">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* USER INFORMATION */}
            <div>
              <h2 className="text-xl font-semibold text-ink">
                {user?.name || "Petugas"}
              </h2>

              <p className="mt-1 text-sm text-muted">
                @{user?.username || "-"}
              </p>

              <div className="mt-3 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                Petugas
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-line" />

        {/* PHOTO SETTINGS */}
        <div className="p-6">
          <h3 className="text-base font-semibold text-ink">
            Foto Profil
          </h3>

          <p className="mt-1 text-sm text-muted">
            Upload foto profil baru. Format yang
            didukung JPG, PNG, dan WebP.
          </p>

          <p className="mt-1 text-xs text-muted">
            Ukuran maksimal 5 MB.
          </p>

          {/* FILE INPUT */}
          <div className="mt-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full max-w-md text-sm text-muted
                file:mr-4
                file:rounded-md
                file:border-0
                file:bg-blue-600
                file:px-4
                file:py-2
                file:text-sm
                file:font-medium
                file:text-white
                hover:file:bg-blue-700"
            />
          </div>

          {/* SAVE BUTTON */}
          <div className="mt-4">
            <button
              type="button"
              onClick={savePhoto}
              disabled={!file || saving}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Menyimpan..."
                : "Simpan Foto"}
            </button>
          </div>

          {/* SUCCESS */}
          {message && (
            <div className="mt-4 rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3">
              <p className="text-sm text-green-400">
                {message}
              </p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}