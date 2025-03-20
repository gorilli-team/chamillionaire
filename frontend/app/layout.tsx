import React from "react";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chamillionaire AI",
  description:
    " AI-powered, privacy-first trading assistant that helps users analyze market trends, optimize their strategies, and execute trades autonomously",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
