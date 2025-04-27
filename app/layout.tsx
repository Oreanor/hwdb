import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon_16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon_32x32.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon/favicon_64x64.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon/favicon_128x128.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
