/*
 * Movie & TV Queue — v1.0.0-rc.2 — 2026-10-30
 * Release history (newest first):
 * v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status.
 * v1.0.0-rc.1: Complete replacement; SRS traceability in REQUIREMENTS.md.
 * 2026-10-29: Original two-file replacement ZIP; unversioned, no embedded history.
 */
export const metadata = {
  title: "Movie & TV Queue", description: "Our shared movie and TV watch list",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Watch Queue", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png", icon: "/icon-192.png" },
};
export const viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }) { return <html lang="en"><body style={{ margin: 0, background: "white", color: "#202020" }}>{children}</body></html>; }
