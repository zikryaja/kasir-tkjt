function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function UserAvatar({ user, size = "md" }) {
  const initials = getInitials(user?.name || user?.username);

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary ${sizes[size] || sizes.md}`}
      title={user?.name || user?.username || "Pengguna"}
      aria-label={user?.name || user?.username || "Pengguna"}
    >
      {initials}
    </div>
  );
}