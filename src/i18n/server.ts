import { detectLangFromRequest } from './detect';
import { loadMessages, createT } from './translate';
import type { Lang } from './config';

export async function getServerI18n(explicitLang?: Lang) {
  const lang = explicitLang ?? await detectLangFromRequest();
  const messages = await loadMessages(lang);
  const t = createT(messages);
  return { lang, messages, t };
}
