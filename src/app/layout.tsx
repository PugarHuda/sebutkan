import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Grant one scoped permission; an AI agent buys papers, reads them with Venice, and splits USDC back to cited authors — gasless, non-custodial.";

export const metadata: Metadata = {
  metadataBase: new URL("https://sebutkan.vercel.app"),
  title: "Sebutkan — the research agent that pays its sources",
  description: DESCRIPTION,
  openGraph: {
    title: "Sebutkan — the research agent that cites and pays its sources",
    description: DESCRIPTION,
    url: "https://sebutkan.vercel.app",
    siteName: "Sebutkan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sebutkan — cites and pays its sources",
    description: DESCRIPTION,
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
