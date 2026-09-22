import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVFlight — Your story. Your next opportunity.",
  description: "Build a thoughtful, professional resume with six LaTeX templates, live previews, private versions, and truthful AI suggestions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
