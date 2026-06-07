import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Free Consultation",
  description: "Book a free Zoom strategy call with our team.",
  alternates: { canonical: "https://pagefoundry.de/consultation" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
