import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import { Geist, Inter_Tight } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentry Loop - AI-on-Call Engineer",
  description: "Autonomous Incident Investigation Agent",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
    lang="en"
    suppressHydrationWarning
    className={`${geistSans.variable} ${interTight.variable} font-sans h-full antialiased`}
    >
        <body 
            suppressHydrationWarning
            className="min-h-full flex flex-col font-sans">
                {children}
                <Analytics />
        </body>
    </html>
  );
}
