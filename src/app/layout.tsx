import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

function TopNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={24} height={24} />
          <span className="serif">Sebutkan</span>
        </Link>
        <div className="flex items-center gap-6 text-[13px] text-[var(--muted)]">
          <Link href="/research" className="transition hover:text-[var(--accent)]">
            Research
          </Link>
          <Link href="/claim" className="transition hover:text-[var(--accent)]">
            Claim &amp; Rewards
          </Link>
          <a
            href="https://github.com/PugarHuda/sebutkan"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-[var(--accent)]"
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
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
