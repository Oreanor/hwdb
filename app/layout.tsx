import type { Metadata } from 'next';
import { Fragment } from 'react';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { THEME_STORAGE_KEY } from './consts';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

// Hosts the thumbnails come from (see utils.ts): warm up their connections so the
// first image loads faster. Relative bases ("/localimg") are same-origin already.
const originOf = (url?: string) => {
  try {
    return url ? new URL(url).origin : undefined;
  } catch {
    return undefined;
  }
};
const IMAGE_ORIGINS = [
  originOf(process.env.NEXT_PUBLIC_IMG_BASE ? process.env.NEXT_PUBLIC_IMG_BASE : process.env.NEXT_PUBLIC_SUPABASE_URL),
].filter((o): o is string => !!o);

// Applies the saved (or OS-preferred) theme before first paint, so there is no flash.
const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

const FAVICON_SIZES = [16, 32, 64, 128];

export const metadata: Metadata = {
  title: 'HWDB — die-cast model database',
  description: 'Browse Hot Wheels, Matchbox, Majorette and Welly castings and variants, and keep your own collection.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {IMAGE_ORIGINS.map((origin) => (
          <Fragment key={origin}>
            <link rel="preconnect" href={origin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={origin} />
          </Fragment>
        ))}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {FAVICON_SIZES.map((s) => (
          <link key={s} rel="icon" type="image/png" sizes={`${s}x${s}`} href={`/favicon/favicon_${s}x${s}.png`} />
        ))}
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
