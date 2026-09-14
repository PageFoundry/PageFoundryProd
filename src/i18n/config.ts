export type Lang = 'en' | 'de';
export const SUPPORTED_LOCALES: Lang[] = ['de', 'en'];
export const DEFAULT_LOCALE: Lang = 'de';
export const LANG_COOKIE = 'lang';
export function isLang(v: any): v is Lang { return v === 'en' || v === 'de'; }
