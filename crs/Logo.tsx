import { Handshake } from 'lucide-react';

export function PeidaMark({ size = 38 }: { size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="size-full" fill="none">
        <defs>
          <linearGradient id="peida-green" x1="15" y1="8" x2="88" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3fc57e" />
            <stop offset="0.55" stopColor="#15a75f" />
            <stop offset="1" stopColor="#0a7c46" />
          </linearGradient>
        </defs>
        <rect x="20" y="30" width="17" height="58" rx="8.5" fill="url(#peida-green)" />
        <circle cx="54" cy="37" r="25" stroke="url(#peida-green)" strokeWidth="17" />
      </svg>
      <Handshake
        className="absolute text-white"
        strokeWidth={2.2}
        size={Math.round(size * 0.36)}
        style={{ left: '54%', top: '37%', transform: 'translate(-50%, -50%)' }}
      />
    </span>
  );
}

/** Icon + wordmark in a row, with the slogan centred underneath the pair. */
export function PeidaLogo({ size = 30, slogan = true }: { size?: number; slogan?: boolean }) {
  return (
    <span className="flex shrink-0 flex-col items-center" aria-label="پیدا، خرید و فروش آسان">
      <span className="flex items-center gap-1">
        <PeidaMark size={size} />
        <b className="text-[17px] font-black leading-none tracking-tight text-zinc-900 dark:text-white">پیدا</b>
      </span>
      {slogan && <small className="mt-0.5 block whitespace-nowrap text-[8px] font-bold leading-none text-[#12a05c]">خرید و فروش آسان</small>}
    </span>
  );
}

/** Large centred lock-up for the welcome and login screens. */
export function PeidaHero({ size = 76 }: { size?: number }) {
  return (
    <span className="flex flex-col items-center">
      <PeidaMark size={size} />
      <b className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">پیدا</b>
      <small className="mt-1 text-[11px] font-bold text-[#12a05c]">خرید و فروش آسان</small>
    </span>
  );
}

export default PeidaLogo;
