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
  title: "Chemik Burger",
  description: "100% Gluten-Free Burgers. Eksperymentalna kuchnia.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chemik Burger",
  },
};

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b", // zinc-950 to match your background exactly
  userScalable: false,
};

import { CartDrawer } from "./components/CartDrawer";
import { FloatingCartButton } from "./components/FloatingCartButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}
      >
        {children}
        <CartDrawer />
        <FloatingCartButton />
      </body>
    </html>
  );
}
