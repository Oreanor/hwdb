import type { Metadata } from "next";
import { Fragment } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { LOCAL_BACKEND, THEME_STORAGE_KEY } from './consts';

// Hosts that serve variant images in cloud mode: Supabase (Hot Wheels) and
// Cloudinary (the other brands) — see getImageUrl in utils.ts.
const IMAGE_HOSTS = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_CLOUDINARY_BASE && new URL(process.env.NEXT_PUBLIC_CLOUDINARY_BASE).origin,
].filter((host): host is string => Boolean(host));

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
  description: "Browse and search Hot Wheels, Matchbox, Majorette and Welly die-cast cars and their variants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Warm up the connections to the image hosts so the first thumbnail loads
            faster. Skipped in local mode, where images are served by this origin. */}
        {!LOCAL_BACKEND &&
          IMAGE_HOSTS.map((host) => (
            <Fragment key={host}>
              <link rel="preconnect" href={host} crossOrigin="anonymous" />
              <link rel="dns-prefetch" href={host} />
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
