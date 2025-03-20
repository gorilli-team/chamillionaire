"use client";

import React from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn("h-16 px-6 flex items-center justify-between", className)}
    >
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Chamillionaire AI</h2>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          Settings
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium">JD</span>
        </div>
      </div>
    </header>
  );
}
