import Link from "next/link";
import { getServerI18n } from "@/i18n/server";

export default async function RegisterPage() {
  const { t } = await getServerI18n();
  return (
    <section className="px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
        <h1 className="text-xl font-semibold mb-4">{t("auth.register.title")}</h1>

        <form id="regForm" className="space-y-3">
          <label className="block text-sm">
            <span className="block mb-1">{t("auth.register.email")}</span>
            <input
              name="email" type="email" required
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm border border-white/10 focus:border-pfOrange"
            />
          </label>

          <label className="block text-sm">
            <span className="block mb-1">{t("auth.register.password")}</span>
            <input
              name="password" type="password" required minLength={8}
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm border border-white/10 focus:border-pfOrange"
            />
          </label>

          <div id="err" className="text-red-400 text-xs h-4"></div>

          <button
            type="submit"
            className="w-full rounded-full bg-pfOrange px-4 py-2 text-black text-sm font-semibold"
          >
            {t("auth.register.submit")}
          </button>

          <div className="text-xs text-zinc-400 mt-3">
            {t("auth.register.haveAccount")}{" "}
            <Link href="/login" className="underline">{t("auth.register.toLogin")}</Link>
          </div>
        </form>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              const f=document.getElementById('regForm');
              const err=document.getElementById('err');
              f.addEventListener('submit', async (e)=>{
                e.preventDefault();
                err.textContent='';
                const fd=new FormData(f);
                const body={ email: fd.get('email'), password: fd.get('password') };
                const res=await fetch('/api/auth/register', {
                  method:'POST',
                  headers:{'Content-Type':'application/json'},
                  credentials:'include',
                  body: JSON.stringify(body)
                });
                if(res.ok){
                  const u=new URL(location.href);
                  const to=u.searchParams.get('next')||'/dashboard';
                  location.href=to;
                } else {
                  const j=await res.json().catch(()=>({message:null}));
                  err.textContent = j?.message || '${'${t("auth.register.errorGeneric")}' }';
                }
              });
            })();
          `
        }}
      />
    </section>
  );
}
