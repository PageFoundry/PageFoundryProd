import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Settings · PageFoundry",
  robots: "noindex",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
