import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import { Geist, Inter_Tight } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentry Loop — AI-on-Call Engineer",
  description: "Autonomous Incident Investigation Agent",
  verification: {
    google: 'VMDzTCjPuPvMQv8nE4t_obHGaCBtmmY28Bm3IwrfeME',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
    lang="en"
    suppressHydrationWarning
    className={`${geistSans.variable} ${interTight.variable} font-sans h-full antialiased`}
    >
        <head>
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-V3D3NDLZZB"
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', 'G-V3D3NDLZZB');
                `}
            </Script>
        </head>
        <body 
            suppressHydrationWarning
            className="min-h-full flex flex-col font-sans">
                {children}
                <Analytics />
        </body>
    </html>
  );
}
