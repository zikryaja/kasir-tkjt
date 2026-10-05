// Kepala halaman yang seragam: judul, deskripsi singkat, dan tombol aksi (opsional).
// Ini <h1> halaman, jadi tiap halaman cukup memakai komponen ini sekali.
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold leading-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}