import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import AttendanceHeartbeat from "@/components/auth/AttendanceHeartbeat";

export const metadata = {
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.name}`,
  },
  description: `Aplikasi kasir ${BRAND.org}`,
};

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("kasir-theme");
    var theme =
      saved === "dark" || saved === "light"
        ? saved
        var theme =
  saved === "dark" || saved === "light"
    ? saved
    : "light";

    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <AttendanceHeartbeat />
        {children}
      </body>
    </html>
  );
}
