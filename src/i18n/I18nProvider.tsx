'use client';
import React, { createContext, useContext } from 'react';
import type { Lang } from './config';
import type { Messages } from './translate';
import { createT } from './translate';

type Ctx = { lang: Lang; messages: Messages; t: (k:string, p?:Record<string,any>)=>string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ lang, messages, children }: { lang: Lang; messages: Messages; children: React.ReactNode }) {
  const t = createT(messages);
  return <I18nCtx.Provider value={{ lang, messages, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('I18nProvider missing');
  return ctx;
}
