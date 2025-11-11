import type { Lang } from './config';

export type Messages = { [key: string]: string | Messages };

export async function loadMessages(lang: Lang): Promise<Messages> {
  if (lang === 'de') return (await import('./locales/de.json')).default;
  return (await import('./locales/en.json')).default;
}

function interpolate(s: string, params?: Record<string,string|number|undefined>) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => params[k] == null ? '' : String(params[k]));
}

export function createT(msgs: Messages) {
  return (key: string, params?: Record<string,string|number|undefined>): string => {
    const parts = key.split('.');
    let cur: any = msgs;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = (cur as any)[p];
      else { cur = undefined; break; }
    }
    if (typeof cur === 'string') return interpolate(cur, params);
    return key;
  };
}
