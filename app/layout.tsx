import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import { VersionFooter } from "@/components/shared/VersionFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Movie Tournament Bracket",
  description: "Settle movie debates NCAA-bracket style.",
};

export const viewport: Viewport = {
  themeColor: "#1b1420",
  // Lets env(safe-area-inset-*) resolve to real values instead of 0px, so
  // the fixed bottom nav can pad above a notched phone's home indicator.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-cream">
        {children}
        <VersionFooter />
      </body>
    </html>
  );
}
