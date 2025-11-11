export type Lang = 'en' | 'de';
export const SUPPORTED_LOCALES: Lang[] = ['en','de'];
export const DEFAULT_LOCALE: Lang = 'en';
export const LANG_COOKIE = 'lang';
export function isLang(v: any): v is Lang { return v === 'en' || v === 'de'; }
