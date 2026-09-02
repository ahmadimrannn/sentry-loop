import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    className={`${geistSans.variable} ${geistMono.variable} font-sans h-full antialiased`}
    >
        <body 
            suppressHydrationWarning
            className="min-h-full flex flex-col font-sans">
                {children}
        </body>
    </html>
  );
}
