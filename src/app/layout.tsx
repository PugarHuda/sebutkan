import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

function TopNav() {
  return (
    <nav className="sticky top-0 z-50 border-b-2 border-[var(--ink)] bg-[var(--paper)]">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-black tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={26} height={26} /> Sebutkan
        </Link>
        <div className="flex items-center gap-1 text-xs font-bold">
          <Link href="/research" className="px-3 py-1.5 hover:bg-[var(--amber)]">
            Research
          </Link>
          <Link href="/claim" className="px-3 py-1.5 hover:bg-[var(--amber)]">
            Claim &amp; Rewards
          </Link>
          <a
            href="https://github.com/PugarHuda/sebutkan"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 hover:bg-[var(--amber)]"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </nav>
  );
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sebutkan — the research agent that pays its sources",
  description:
    "Grant one scoped permission; an AI agent buys papers, reads them with Venice, and splits USDC back to cited authors — gasless, non-custodial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <TopNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
