import React from "react";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "A simple Next.js application",
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
