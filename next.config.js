/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Worktrees liegen unterhalb des Haupt-Repositories. Ohne explizite Root-Angabe
  // waehlt Next wegen des uebergeordneten package-lock.json das Haupt-Repo und legt
  // server.js in einem verschachtelten Standalone-Pfad ab.
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3', 'playwright', 'lighthouse', 'chrome-launcher', 'pdfkit'],
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/email/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;
