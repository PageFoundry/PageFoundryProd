import { cookies, headers } from 'next/headers';
import { LANG_COOKIE, DEFAULT_LOCALE, SUPPORTED_LOCALES, type Lang, isLang } from './config';

export function pickFromAcceptLanguage(al: string | null | undefined): Lang {
  if (!al) return DEFAULT_LOCALE;
  const parts = al.split(',').map(s=>s.trim().toLowerCase());
  for (const p of parts) {
    const code = p.split(';')[0];
    if (code.startsWith('de')) return 'de';
    if (code.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}

export async function detectLangFromRequest(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  const h = (await headers()).get('accept-language');
  const guess = pickFromAcceptLanguage(h);
  return SUPPORTED_LOCALES.includes(guess) ? guess : DEFAULT_LOCALE;
}
