'use client';
import { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';

type Slot =
  | 'MON_12_14' | 'MON_14_16' | 'MON_16_18' | 'MON_18_20'
  | 'TUE_12_14' | 'TUE_14_16' | 'TUE_16_18' | 'TUE_18_20'
  | 'WED_12_14' | 'WED_14_16' | 'WED_16_18' | 'WED_18_20';

const SLOT_META: Record<Slot, [string, number, number]> = {
  MON_12_14:['Mon',12,14], MON_14_16:['Mon',14,16], MON_16_18:['Mon',16,18], MON_18_20:['Mon',18,20],
  TUE_12_14:['Tue',12,14], TUE_14_16:['Tue',14,16], TUE_16_18:['Tue',16,18], TUE_18_20:['Tue',18,20],
  WED_12_14:['Wed',12,14], WED_14_16:['Wed',14,16], WED_16_18:['Wed',16,18], WED_18_20:['Wed',18,20],
};

const ORDER: Slot[] = [
  'MON_12_14','MON_14_16','MON_16_18','MON_18_20',
  'TUE_12_14','TUE_14_16','TUE_16_18','TUE_18_20',
  'WED_12_14','WED_14_16','WED_16_18','WED_18_20',
];

function label(t: (k:string)=>string, v: Slot) {
  const [wd, s, e] = SLOT_META[v];
  return `${t('consultation.slot.'+wd)} ${s+1}–${e+1} (MEZ)`;
}

export default function ConsultationPage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [slot, setSlot] = useState<Slot>('MON_18_20');
  const [note, setNote] = useState('');
  const [ok, setOk] = useState<null | string>(null);
  const [err, setErr] = useState<null | string>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null); setErr(null);
    const res = await fetch('/api/consultation', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, phone, preferredTime: slot, note }),
    });
    const data = await res.json().catch(()=>({}));
    if (res.ok) setOk(t('consultation.ok'));
    else setErr(data.message || t('consultation.failed'));
  }

  return (
    <section className="relative z-10 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
        <h1 className="text-xl font-semibold mb-4">{t('consultation.title')}</h1>
        <p className="text-sm text-zinc-400 mb-6">{t('consultation.subtitle')}</p>

        <form onSubmit={submit} className="space-y-4">

          <label className="block text-sm">
            <span className="text-zinc-300">{t('consultation.name')}</span>
            <input required className="w-full bg-black/40 border border-white/10 rounded px-3 py-2"
              value={name} onChange={e=>setName(e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-300">{t('consultation.email')}</span>
            <input required type="email"
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2"
              value={email} onChange={e=>setEmail(e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-300">{t('consultation.phone')}</span>
            <input required className="w-full bg-black/40 border border-white/10 rounded px-3 py-2"
              value={phone} onChange={e=>setPhone(e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-300">{t('consultation.preferred')}</span>
            <select className="w-full bg-black/40 border border-white/10 rounded px-3 py-2"
              value={slot} onChange={e=>setSlot(e.target.value as Slot)}>
              {ORDER.map(v => <option key={v} value={v}>{label(t, v)}</option>)}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-zinc-300">{t('consultation.notes')}</span>
            <textarea className="w-full bg-black/40 border border-white/10 rounded px-3 py-2"
              rows={3} value={note} onChange={e=>setNote(e.target.value)} />
          </label>

          <button type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-pfOrange px-4 py-2 text-black text-sm font-semibold">
            {t('consultation.book')}
          </button>

          {ok && <p className="text-green-400 text-sm mt-2">{ok}</p>}
          {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
        </form>
      </div>
    </section>
  );
}
