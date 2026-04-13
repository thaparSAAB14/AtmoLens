import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import StyledComponentsRegistry from "@/lib/registry";

export const metadata: Metadata = {
  metadataBase: new URL("https://atmolens.priyanshu.world"),
  title: "AtmoLens — Automated ECCC Synoptic Map Enhancement",
  description:
    "Grayscale Environment Canada analysis maps transformed into color-enhanced, easy-to-read weather maps — automatically, every 30 minutes.",
  keywords: [
    "ECCC", "weather maps", "synoptic charts", "meteorology", 
    "Canada weather", "automated maps", "GIS processing"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AtmoLens — Atmospheric Restoration",
    description: "Real-time automated enhancement of ECCC meteorological charts.",
    url: "https://atmolens.priyanshu.world",
    siteName: "AtmoLens",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
  },
  twitter: {
    card: "summary_large_image",
    title: "AtmoLens — Atmospheric Restoration",
    description: "Real-time automated enhancement of ECCC meteorological charts.",
  },
};

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <StyledComponentsRegistry>
          <ThemeProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </ThemeProvider>
        </StyledComponentsRegistry>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
