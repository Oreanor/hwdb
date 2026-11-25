import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { THEME_STORAGE_KEY } from './consts';
import { Fragment } from 'react';

// Hosts the thumbnails come from (see utils.ts): warm up their connections so the
// first image loads faster. NEXT_PUBLIC_IMG_BASE, when absolute, replaces the cloud hosts.
const originOf = (url?: string) => {
  try { return url ? new URL(url).origin : undefined; } catch { return undefined; }
};
const IMAGE_ORIGINS = [
  ...new Set(
    (process.env.NEXT_PUBLIC_IMG_BASE
      ? [originOf(process.env.NEXT_PUBLIC_IMG_BASE)]
      : [originOf(process.env.NEXT_PUBLIC_SUPABASE_URL), originOf(process.env.NEXT_PUBLIC_CLOUDINARY_BASE)]
    ).filter((o): o is string => !!o),
  ),
];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hot Wheels DataBase",
  description: "Explore the complete collection of Hot Wheels cars from different years",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {IMAGE_ORIGINS.map((origin) => (
          <Fragment key={origin}>
            <link rel="preconnect" href={origin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={origin} />
          </Fragment>
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon_16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon_32x32.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon/favicon_64x64.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon/favicon_128x128.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
