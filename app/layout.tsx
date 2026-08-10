import type { Metadata } from "next";
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
