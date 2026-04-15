import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { PalettePicker } from "@/components/PalettePicker";
import { PALETTE_BOOTSTRAP_SCRIPT } from "@/lib/palette-storage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Morning Analytics",
  description: "Insights from your morning pages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="palette-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: PALETTE_BOOTSTRAP_SCRIPT }}
        />
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <PalettePicker />
      </body>
    </html>
  );
}
