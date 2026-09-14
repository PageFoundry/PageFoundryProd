'use client';
import { useI18n } from '@/i18n/useI18n';
import type { Lang } from '@/i18n/config';
import { usePathname } from 'next/navigation';

export default function LanguageSwitch() {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const next: Lang = lang === 'en' ? 'de' : 'en';

  async function handleSwitch() {
    try {
      await fetch('/api/i18n', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: next }),
      });
    } catch {}

    if (pathname === '/' || pathname === '/en') {
      location.assign(next === 'en' ? '/en' : '/');
      return;
    }

    location.reload();
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="rounded-lg border border-white/20 px-3 py-1 text-white/80 hover:text-white hover:border-white/40 transition text-sm"
      aria-label={t('navbar.language')}
    >
      {next === 'en' ? t('navbar.en') : t('navbar.de')}
    </button>
  );
}
