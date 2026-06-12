import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

function TopNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/70 backdrop-blur-md dark:border-neutral-800/70 dark:bg-black/50">
      <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Sebutkan
        </Link>
        <div className="flex items-center gap-5 text-xs text-neutral-500">
          <Link href="/research" className="hover:text-neutral-900 dark:hover:text-white">Research</Link>
          <Link href="/claim" className="hover:text-neutral-900 dark:hover:text-white">Claim &amp; Rewards</Link>
          <a
            href="https://github.com/PugarHuda/sebutkan"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-900 dark:hover:text-white"
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
