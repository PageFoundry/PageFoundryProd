import Link from "next/link";
import { getUserFromCookie } from "@/lib/auth";

export default async function Navbar() {
  const user = getUserFromCookie();
  const isAuthed = !!user;

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/70 backdrop-blur-md z-50 border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-white font-semibold text-lg tracking-tight">
          PageFoundry
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-white/80 hover:text-white transition">Packages</Link>

          {isAuthed ? (
            <>
              <Link href="/dashboard" className="text-white/80 hover:text-white transition">
                Dashboard
              </Link>

              {user?.role === "ADMIN" && (
                <Link href="/admin" className="text-white/80 hover:text-pfOrange font-semibold border border-pfOrange/40 rounded-lg px-3 py-1 transition">
                  Admin
                </Link>
              )}

              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="rounded-full bg-pfOrange px-4 py-2 text-black font-semibold hover:brightness-110">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/80 hover:text-white transition">Login</Link>
              <Link href="/register" className="rounded-full bg-pfOrange px-4 py-2 text-black font-semibold hover:brightness-110">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
