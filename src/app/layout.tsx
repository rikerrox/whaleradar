import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BlockchainBalanceSync } from "@/components/wallet-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhaleRadar AI - Track Smart Money on Solana",
  description: "Track whale wallets entering LONG trades on meme coins across the Solana ecosystem. Real-time whale monitoring, copy trading, and smart money analytics.",
  keywords: ["WhaleRadar", "Solana", "whale tracking", "copy trading", "meme coins", "crypto", "DEX"],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <BlockchainBalanceSync />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
