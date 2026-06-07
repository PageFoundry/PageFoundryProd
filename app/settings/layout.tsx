import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Settings",
  robots: "noindex",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
