"use client";

import React from "react";
import { useLogin, usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0];

  return (
    <header
      className={cn("h-16 px-6 flex items-center justify-between", className)}
    >
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Chamillionaire AI</h2>
      </div>
      <div className="flex items-center space-x-4">
        {ready && authenticated ? (
          <>
            <div className="flex items-center gap-2">
              {activeWallet?.address && (
                <span className="text-sm text-muted-foreground">
                  {activeWallet.address.slice(0, 6)}...
                  {activeWallet.address.slice(-4)}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                Disconnect
              </Button>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-black">
              <span className="text-sm font-medium">
                {user?.email?.address?.slice(0, 2).toUpperCase() || "AI"}
              </span>
            </div>
          </>
        ) : (
          <Button onClick={login} disabled={!ready} size="sm">
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  );
}
