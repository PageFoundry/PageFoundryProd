import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Free Consultation · PageFoundry",
  description: "Book a free Zoom strategy call with our team.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
