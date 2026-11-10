import type { Metadata } from "next";
import ConsultationForm from "./ConsultationForm";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  if (Object.keys(params).length === 0) return {};
  return { robots: { index: false, follow: true } };
}

export default function ConsultationPage() {
  return <ConsultationForm />;
}
