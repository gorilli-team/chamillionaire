"use client";

import React, { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { BaseLayout } from "@/components/layout/base-layout";
import { usePrivy } from "@privy-io/react-auth";

interface UserData {
  automationEnabled: boolean;
}

export default function AutomationPage() {
  const { user, authenticated, ready } = usePrivy();
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [me, setMe] = React.useState<UserData | null>(null);
  useEffect(() => {
    fetchMe();
  }, [user?.wallet?.address, authenticated, ready]);

  const fetchMe = async () => {
    if (!user?.wallet?.address) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me?address=${user.wallet.address}`
    );
    const data = await res.json();
    setMe(data);
    setIsEnabled(data.automationEnabled);
  };

  const handleToggle = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/automation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: user?.wallet?.address,
        automationEnabled: !isEnabled,
      }),
    });
    setIsEnabled(!isEnabled);
  };

  return (
    <BaseLayout>
      {!ready ? (
        <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm">
          <div className="animate-pulse">Loading Privy...</div>
        </div>
      ) : !authenticated ? (
        <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm">
          <p className="text-lg font-medium">
            Please connect your wallet to view your transaction history
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-8 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">
              Automation Settings
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-black/60">
                {isEnabled ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={me?.automationEnabled}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-black"
              />
            </div>
          </div>

          {!isEnabled && (
            <div className="rounded-lg bg-black/5 p-4">
              <div className="flex items-center gap-3 text-black/80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>
                  Automation is currently disabled
                  <br />
                  <span className="text-sm text-black/60">
                    Enable automation to allow the AI to execute trades based on
                    your preferences and settings.
                  </span>
                </p>
              </div>
            </div>
          )}

          {isEnabled && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg bg-black/5 p-6">
                  <h3 className="text-lg font-semibold">General Settings</h3>
                  <p className="text-sm text-black/60 mb-6">
                    Configure how the AI assistant executes trades on your
                    behalf
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="flex justify-between mb-2">
                        <span>Risk Level</span>
                        <span className="text-black/60">Medium</span>
                      </label>
                      <div className="h-2 rounded-full bg-black/10">
                        <div className="h-full w-1/2 rounded-full bg-black" />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-black/40">
                        <span>Very Low</span>
                        <span>Very High</span>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2">Max Trade Size (%)</label>
                      <input
                        type="number"
                        value="5"
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
                      />
                      <p className="mt-1 text-xs text-black/40">
                        Maximum percentage of portfolio per trade
                      </p>
                    </div>

                    <div>
                      <label className="block mb-2">Trading Pairs</label>
                      <div className="flex gap-2">
                        <span className="rounded-lg bg-black px-3 py-1.5 text-sm text-white">
                          BTC/USDT
                        </span>
                        <span className="rounded-lg bg-black px-3 py-1.5 text-sm text-white">
                          ETH/USDT
                        </span>
                        <button className="rounded-lg border border-black/10 px-3 py-1.5 text-sm">
                          +
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-black/40">
                        Assets the AI can trade
                      </p>
                    </div>

                    {/* <div>
                      <label className="block mb-2">Execution Method</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="execution"
                            checked
                            className="h-4 w-4"
                          />
                          <span>Require Approval</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="execution"
                            className="h-4 w-4"
                          />
                          <span>Fully Automatic</span>
                        </label>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button className="rounded-lg px-4 py-2 text-sm text-black/60 hover:bg-black/5">
                  Reset to Defaults
                </button>
                <button className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseLayout>
  );
}
