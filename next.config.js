/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Worktrees liegen unterhalb des Haupt-Repositories. Ohne explizite Root-Angabe
  // waehlt Next wegen des uebergeordneten package-lock.json das Haupt-Repo und legt
  // server.js in einem verschachtelten Standalone-Pfad ab.
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3', 'playwright', 'lighthouse', 'chrome-launcher', 'pdfkit'],
  // Routes of the site version before spring 2026 still get links and impressions.
  // /website-agentur-remscheid stays out until the domain experiment ends on 2026-12-12.
  async redirects() {
    return [
      { source: '/website-agentur-hueckeswagen', destination: '/', permanent: true },
      { source: '/website-agentur-obk', destination: '/webdesign-bergisches-land', permanent: true },
      { source: '/website-agentur-radevormwald', destination: '/webdesign-radevormwald', permanent: true },
      { source: '/landingpage-erstellen-lassen', destination: '/website-erstellen-lassen', permanent: true },
      { source: '/seo-optimierung', destination: '/seo-hueckeswagen', permanent: true },
      { source: '/pagespeed-optimierung', destination: '/seo-hueckeswagen', permanent: true },
      { source: '/website-hosting', destination: '/website-wache', permanent: true },
      { source: '/website-wartung', destination: '/website-wache', permanent: true },
      { source: '/case-studies', destination: '/projekte', permanent: true },
      { source: '/case-studies/:path*', destination: '/projekte', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/social-audit-ui/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/email/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;
