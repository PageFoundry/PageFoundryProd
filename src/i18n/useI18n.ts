'use client';
import { useI18n as useBase } from './I18nProvider';
import { useCallback } from 'react';
import type { Lang } from './config';

export function useI18n() {
  const ctx = useBase();
  const switchLang = useCallback(async (lang: Lang) => {
    try {
      await fetch('/api/i18n', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang }) });
    } catch {}
    location.reload();
  }, []);
  return { ...ctx, switchLang };
}
