import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { PeidaHero } from './Logo';
import type { User } from './data';

export default function Onboarding({ onDone }: { onDone: (user: User) => void }) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait(wait - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const request = async () => {
    if (!/^09\d{9}$/.test(phone)) { setError('شماره موبایل را با ۱۱ رقم و شروع با ۰۹ وارد کنید.'); return; }
    setError(''); setInfo(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const data = await response.json() as { deliveryAvailable?: boolean; previewCode?: string };
      if (!response.ok) throw new Error('request');
      setPreview(data.previewCode || '');
      setInfo(data.deliveryAvailable ? 'کد تأیید به شماره شما پیامک شد.' : 'سرویس پیامک هنوز تنظیم نشده است؛ کد ورود این‌جا نمایش داده می‌شود.');
      setStep('code'); setWait(90);
    } catch { setError('ارسال کد انجام نشد؛ اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.'); } finally { setBusy(false); }
  };

  const verify = async () => {
    if (code.length < 4) { setError('کد تأیید را کامل وارد کنید.'); return; }
    setError(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code }) });
      const data = await response.json() as { user?: User };
      if (!response.ok || !data.user) throw new Error('verify');
      onDone(data.user);
    } catch { setError('کد وارد شده درست نیست یا منقضی شده است.'); } finally { setBusy(false); }
  };

  return (
    <div data-testid="onboarding" className="min-h-dvh bg-[#f4f6f5] px-4 py-10 dark:bg-[#0e1513] dark:text-zinc-100">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <PeidaHero size={78} />
          <p className="mt-5 text-[13px] leading-7 text-zinc-500 dark:text-zinc-400">
            برای استفاده از پیدا، شماره همراه خود را وارد کنید. یک کد تأیید برایتان پیامک می‌شود.
          </p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(20,60,40,.08)] dark:bg-[#17211e]">
          {step === 'phone' ? (
            <>
              <label className="block">
                <b className="mb-2 flex items-center gap-1 text-sm"><Smartphone size={16} className="text-[#12a05c]" /> شماره همراه</b>
                <input
                  data-testid="phone-input" dir="ltr" inputMode="numeric" autoFocus
                  className="input text-center text-lg font-black tracking-[.18em]"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="09xxxxxxxxx"
                />
              </label>
              <button data-testid="request-code" onClick={() => void request()} disabled={busy} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#12a05c] text-sm font-black text-white disabled:opacity-60">
                {busy ? <><Loader2 size={17} className="animate-spin" /> در حال ارسال کد...</> : 'دریافت کد تأیید'}
              </button>
              <p className="mt-4 flex items-start gap-2 text-[11px] leading-6 text-zinc-500">
                <ShieldCheck size={15} className="mt-1 shrink-0 text-[#12a05c]" />
                شماره شما فقط برای تأیید حساب و ارتباط خریدار و فروشنده استفاده می‌شود.
              </p>
            </>
          ) : (
            <>
              <button data-testid="change-phone" onClick={() => { setStep('phone'); setCode(''); setError(''); }} className="flex items-center gap-1 text-[11px] text-zinc-500">
                <ArrowRight size={14} /> تغییر شماره
              </button>
              <p className="mt-3 text-[12px] text-zinc-500">کد تأیید ارسال‌شده به <b dir="ltr" className="text-zinc-700 dark:text-zinc-200">{phone}</b> را وارد کنید.</p>
              <input
                data-testid="otp-input" dir="ltr" inputMode="numeric" autoFocus
                className="input mt-3 text-center text-xl font-black tracking-[.5em]"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="------"
              />
              {preview && <p data-testid="preview-code" className="mt-3 rounded-xl bg-amber-50 p-3 text-center text-xs font-bold leading-6 text-amber-800">کد ورود شما: {preview}</p>}
              <button data-testid="verify-code" onClick={() => void verify()} disabled={busy} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#12a05c] text-sm font-black text-white disabled:opacity-60">
                {busy ? <><Loader2 size={17} className="animate-spin" /> در حال بررسی...</> : 'تأیید و ورود به پیدا'}
              </button>
              <button data-testid="resend-code" disabled={wait > 0 || busy} onClick={() => void request()} className="mt-3 min-h-10 w-full text-xs font-bold text-[#0b7f47] disabled:text-zinc-400">
                {wait > 0 ? 'ارسال دوباره کد تا ' + wait + ' ثانیه دیگر' : 'ارسال دوباره کد'}
              </button>
            </>
          )}
          {info && <p data-testid="onboarding-info" className="mt-3 rounded-xl bg-emerald-50 p-3 text-[11px] leading-6 text-[#0b7f47] dark:bg-emerald-950/30">{info}</p>}
          {error && <p data-testid="onboarding-error" className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] font-bold leading-6 text-rose-600 dark:bg-rose-950/30">{error}</p>}
        </div>
      </div>
    </div>
  );
}
