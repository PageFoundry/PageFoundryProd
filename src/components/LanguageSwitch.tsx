'use client';
import { useI18n } from '@/i18n/useI18n';
import type { Lang } from '@/i18n/config';

export default function LanguageSwitch() {
  const { lang, t, switchLang } = useI18n();
  const next: Lang = lang === 'en' ? 'de' : 'en';
  return (
    <button
      type="button"
      onClick={() => switchLang(next)}
      className="rounded-lg border border-white/20 px-3 py-1 text-white/80 hover:text-white hover:border-white/40 transition text-sm"
      aria-label={t('navbar.language')}
    >
      {next === 'en' ? t('navbar.en') : t('navbar.de')}
    </button>
  );
}
