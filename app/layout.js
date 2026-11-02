/* v1.0.0-rc.3 — 2026-11-02: approved ratings, diagnostics, enrichment and custom icons. */
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [180, 167, 152].map(size => ({ url: size === 180 ? "/apple-touch-icon.png" : `/apple-touch-icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png" })),
  },
};
export const viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }) { return <html lang="en"><body style={{ margin: 0, background: "white", color: "#202020" }}>{children}</body></html>; }
