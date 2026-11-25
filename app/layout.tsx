import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { THEME_STORAGE_KEY } from './consts';
import { IMG_BASE } from './utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

// The image host's origin, to warm up its connection so the first thumbnail
// loads faster. A relative base ("/localimg") is same-origin: nothing to warm up.
const IMAGE_ORIGIN = (() => {
  try {
    return new URL(IMG_BASE).origin;
  } catch {
    return undefined;
  }
})();

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
        {IMAGE_ORIGIN && (
          <>
            <link rel="preconnect" href={IMAGE_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={IMAGE_ORIGIN} />
          </>
        )}
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
