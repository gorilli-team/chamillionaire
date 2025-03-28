"use client";

import React, { useEffect, useState } from "react";
import { BaseLayout } from "../../../components/layout/base-layout";
import { usePrivy } from "@privy-io/react-auth";
import { CheckIcon, X } from "lucide-react";

interface Signal {
  _id: string;
  signal: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  confidenceScore: number;
  eventId: number;
  motivation: string;
  createdAt: string;
  updatedAt: string;
  wasTriggered: boolean;
  wasRead: boolean;
  automationMessage: string;
}

export default function TradingPage() {
  const { user } = usePrivy();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        if (!user?.wallet?.address) {
          console.log("No address found");
          //fetch all signals from generic endpoint
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/signals`
          );
          const data = await response.json();
          setSignals(data);
        } else {
          console.log("Fetching signals for address:", user.wallet.address);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-signals/allSignals?address=${user.wallet.address}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch signals");
          }
          const data = await response.json();
          setSignals(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);

  return (
    <BaseLayout>
      <div className="space-y-8 w-full px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Trading Signals
            </h1>
            <p className="text-black/50 mt-1">
              AI-powered trading signals for Base tokens
            </p>
          </div>

          <div className="bg-[rgb(0,82,255)] backdrop-blur-sm px-4 py-1 rounded-full">
            <span className="text-sm font-semibold text-white">
              Base Network
            </span>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
            <div className="animate-pulse">Loading signals...</div>
          </div>
        ) : error ? (
          <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : signals.length === 0 ? (
          <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
            <p className="text-lg font-medium">No trading signals available</p>
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-xl shadow-xl rounded-2xl border-2 border-black/5 hover:border-black/10 transition-all">
            <div
              className="grid text-sm font-medium text-black/70 p-6 border-b-2 border-black/5"
              style={{
                gridTemplateColumns: "15% 15% 20% 30% 20%",
              }}
            >
              <div>Signal</div>
              <div>Symbol</div>
              <div>Quantity</div>
              <div>Confidence</div>
              <div>Time</div>
            </div>

            <div className="divide-y-2 divide-black/5">
              {signals.map((signal) => (
                <div
                  key={signal._id}
                  className="p-6 hover:bg-black/[0.02] transition-colors"
                >
                  <div
                    className="grid mb-4"
                    style={{
                      gridTemplateColumns: "15% 15% 20% 30% 20%",
                    }}
                  >
                    <div className="flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          signal.signal === "BUY"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {signal.signal}
                      </span>
                    </div>
                    <div className="self-center font-medium">
                      {signal.symbol}
                    </div>
                    <div className="self-center font-mono">
                      {signal.quantity}
                    </div>
                    <div className="self-center pr-4">
                      <div className="w-full bg-black/5 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            signal.confidenceScore >= 0.7
                              ? "bg-green-500"
                              : signal.confidenceScore >= 0.4
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${signal.confidenceScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-black/50">
                        {(signal.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="self-center text-sm text-black/50">
                      {new Date(signal.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-black pl-4 border-l-2 border-black/10">
                    {signal.motivation}
                  </div>
                  {signal.automationMessage && (
                    <div className="text-sm pl-4 border-l-2 border-black/10 py-3 bg-black/[0.02] rounded-r-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="font-semibold text-blue-700">
                          Automation Status
                        </span>
                      </div>
                      <p className="text-black/80">
                        {signal.automationMessage}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-4 pl-4 border-l-2 border-black/10">
                    {signal.wasTriggered !== undefined && (
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                          signal.wasTriggered
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        }`}
                      >
                        {signal.wasTriggered ? (
                          <>
                            <CheckIcon className="w-4 h-4" />
                            <span>Trade Executed</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            <span>Not Triggered</span>
                          </>
                        )}
                      </div>
                    )}
                    {signal.wasRead !== undefined && (
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                          signal.wasRead
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {signal.wasRead ? (
                          <>
                            <CheckIcon className="w-4 h-4" />
                            <span>Signal Reviewed</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            <span>New Signal</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
