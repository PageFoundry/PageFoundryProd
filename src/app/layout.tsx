import './globals.css';
import { ReactNode } from 'react';
import BackgroundAnimated from '@/components/BackgroundAnimated';
import Navbar from '@/components/Navbar';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getServerI18n } from '@/i18n/server';

export const metadata = {
  title: 'PageFoundry',
  description: 'High-converting landing pages, hosting, SEO, maintenance.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, messages } = await getServerI18n();
  return (
    <html lang={lang}>
      <body className="relative min-h-screen bg-pfBg text-pfText">
        <BackgroundAnimated />
        <I18nProvider lang={lang} messages={messages}>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/10 text-xs text-zinc-500 px-6 py-10 text-center">
              <div className="max-w-screen-xl mx-auto flex flex-col gap-2">
                <div>© {new Date().getFullYear()} PageFoundry</div>
                <div className="flex gap-4 justify-center flex-wrap">
                  <span>Impressum</span>
                  <span>Datenschutz</span>
                  <span>AGB</span>
                </div>
              </div>
            </footer>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
