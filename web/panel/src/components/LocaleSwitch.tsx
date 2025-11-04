'use client';
import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@lib/i18n';

export function LangSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname() || '/';

  function switchTo(next: Locale) {
    document.cookie = `lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const nextPath = pathname.replace(/^\/(en|pt)(\/|$)/, `/${next}$2`);
    router.push(nextPath);
  }

  return (
    <div style={{ display:'flex', gap:8 }}>
      {locales.map(l => (
        <button key={l} onClick={() => switchTo(l)} disabled={l===current}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}