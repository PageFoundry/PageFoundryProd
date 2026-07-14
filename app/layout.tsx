import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Bebas_Neue, Space_Grotesk, Space_Mono } from 'next/font/google';
import BackgroundAnimated from '@/components/BackgroundAnimated';
import Navbar from '@/components/Navbar';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getServerI18n } from '@/i18n/server';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const BASE = "https://pagefoundry.de";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "PageFoundry | Landing Pages, Hosting & SEO",
    template: "%s · PageFoundry",
  },
  description:
    "PageFoundry baut hochkonvertierende Landing Pages, übernimmt Hosting, SEO-Optimierung und Speed-Tuning – transparent kalkuliert, ohne Retainer.",
  keywords: [
    "Landing Page Agentur",
    "Landing Page erstellen lassen",
    "SEO Optimierung",
    "Website Hosting",
    "Speed Optimierung",
    "Google Ranking verbessern",
    "Web Agentur Deutschland",
  ],
  authors: [{ name: "PageFoundry", url: BASE }],
  creator: "PageFoundry",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE,
    languages: {
      "de": BASE,
      "en": BASE,
      "x-default": BASE,
    },
  },
  openGraph: {
    type: "website",
    siteName: "PageFoundry",
    title: "PageFoundry | Landing Pages, Hosting & SEO",
    description:
      "Hochkonvertierende Landing Pages, Hosting, SEO & Speed-Optimierung. Klar kalkuliert, keine Retainer.",
    url: BASE,
    locale: "de_DE",
    alternateLocale: ["en_US"],
    images: [{ url: "/PAGEfoundry.png", alt: "PageFoundry" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PageFoundry | Landing Pages, Hosting & SEO",
    description:
      "Hochkonvertierende Landing Pages, Hosting, SEO & Speed-Optimierung.",
    site: "@pagefoundry",
    images: ["/PAGEfoundry.png"],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { lang, messages } = await getServerI18n();
  return (
    <html lang={lang} className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="relative min-h-screen bg-pfBg text-pfText">
        <BackgroundAnimated />
        <I18nProvider lang={lang} messages={messages}>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-pfBorder text-xs text-pfMuted px-6 py-10">
              <div className="max-w-screen-xl mx-auto flex flex-col gap-2 items-center">
                <span className="font-mono tracking-widest uppercase text-[0.6rem] text-pfMuted">
                  © {new Date().getFullYear()} PageFoundry
                </span>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-[0.6rem] tracking-widest uppercase">
                  <a href="mailto:admin@pagefoundry.de" className="hover:text-pfAccent transition-colors">admin@pagefoundry.de</a>
                  <a href="tel:+4921928743999" className="hover:text-pfAccent transition-colors">+49 2192 8743999</a>
                </div>
                <div className="flex gap-6 font-mono text-[0.6rem] tracking-widest uppercase">
                  <a href="/impressum" className="hover:text-pfAccent transition-colors">{lang === "de" ? "Impressum" : "Imprint"}</a>
                  <a href="/datenschutz" className="hover:text-pfAccent transition-colors">{lang === "de" ? "Datenschutz" : "Privacy"}</a>
                  <a href="/agb" className="hover:text-pfAccent transition-colors">{lang === "de" ? "AGB" : "Terms"}</a>
                </div>
              </div>
            </footer>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
