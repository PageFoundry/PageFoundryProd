import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Register",
  robots: "noindex",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
