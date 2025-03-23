"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "sonner";

interface BaseLayoutProps {
  children: React.ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar className="fixed left-0 top-0 z-40 h-screen w-64 border-r" />
      <div className="pl-64">
        <Header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        <main className="container mx-auto p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
