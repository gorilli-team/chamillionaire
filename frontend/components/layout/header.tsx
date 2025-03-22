"use client";

import React, { useState } from "react";
import { useLogin, usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { ChevronDown, Check } from "lucide-react";

// Define Base network parameters
const BASE_CHAIN_ID = "eip155:8453";
const BASE_CHAIN_CONFIG = {
  chainId: "0x2105", // 8453 in hex
  chainName: "Base Mainnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const isConnectedToBase = activeWallet?.chainId === BASE_CHAIN_ID;

  // Function to switch to Base network
  const switchToBase = async () => {
    if (!activeWallet || isConnectedToBase) {
      setIsChainSelectorOpen(false);
      return;
    }

    try {
      setIsSwitchingNetwork(true);

      // Use the switchChain method available on all Privy wallets
      try {
        // Convert the chain ID from hex string to number (Base Mainnet: 8453)
        await activeWallet.switchChain(8453);
        console.log("Successfully switched to Base network");
      } catch (switchError) {
        console.error("Error switching to Base:", switchError);

        // For external wallets that require adding the network first
        if (activeWallet.walletClientType !== "privy") {
          try {
            // Get the provider and await the Promise
            const provider = await activeWallet.getEthereumProvider?.();

            if (provider) {
              await provider.request({
                method: "wallet_addEthereumChain",
                params: [BASE_CHAIN_CONFIG],
              });
            }
          } catch (addNetworkError) {
            console.error("Error adding Base network:", addNetworkError);
          }
        }
      }
    } catch (error) {
      console.error("Error in network switching process:", error);
    } finally {
      setIsSwitchingNetwork(false);
      setIsChainSelectorOpen(false);
    }
  };

  return (
    <header
      className={cn("h-16 px-6 flex items-center justify-between", className)}
    >
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Chamillionaire AI 🦎</h2>
      </div>
      <div className="flex items-center space-x-4">
        {ready && authenticated ? (
          <>
            {activeWallet?.address && (
              <div className="flex items-center">
                {/* Chain Selector Button */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 border border-gray-300 rounded-lg",
                      isConnectedToBase ? "bg-gray-100" : "bg-white"
                    )}
                    onClick={() => setIsChainSelectorOpen(!isChainSelectorOpen)}
                    disabled={isSwitchingNetwork}
                  >
                    {/* Base Logo SVG */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0Z"
                        fill={isConnectedToBase ? "#0052FF" : "#E2E2E2"}
                      />
                      <path
                        d="M12 4.5C16.1421 4.5 19.5 7.85786 19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5Z"
                        fill="white"
                      />
                      <path
                        d="M12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5Z"
                        fill={isConnectedToBase ? "#0052FF" : "#E2E2E2"}
                      />
                    </svg>

                    <span
                      className={cn(
                        "font-medium",
                        isConnectedToBase ? "text-black" : "text-gray-500"
                      )}
                    >
                      {isSwitchingNetwork
                        ? "Switching..."
                        : isConnectedToBase
                        ? "Base"
                        : "Select Network"}
                    </span>
                    <ChevronDown size={16} />
                  </Button>

                  {/* Dropdown Menu */}
                  {isChainSelectorOpen && !isSwitchingNetwork && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <h3 className="text-sm font-semibold px-3 py-2 text-gray-700">
                          Select Network
                        </h3>
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                          onClick={switchToBase}
                        >
                          <div className="flex items-center gap-2">
                            {/* Base Logo */}
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0Z"
                                fill="#0052FF"
                              />
                              <path
                                d="M12 4.5C16.1421 4.5 19.5 7.85786 19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5Z"
                                fill="white"
                              />
                              <path
                                d="M12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5Z"
                                fill="#0052FF"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium">Base</p>
                              <p className="text-xs text-gray-500">
                                Base Blockchain Assets
                              </p>
                            </div>
                          </div>
                          {isConnectedToBase && (
                            <Check size={16} className="text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Address Display */}
                <div className="ml-2 px-3 py-1 rounded-lg border border-gray-300 bg-gray-50">
                  <span className="text-sm text-gray-700">
                    {activeWallet.address.slice(0, 6)}...
                    {activeWallet.address.slice(-4)}
                  </span>
                </div>

                {/* Network Status Indicator */}
                {!isConnectedToBase && !isSwitchingNetwork && (
                  <div
                    className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-md text-xs font-medium cursor-pointer hover:bg-red-200"
                    onClick={switchToBase}
                  >
                    Switch to Base
                  </div>
                )}

                {/* Disconnect Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="ml-2"
                >
                  Disconnect
                </Button>
              </div>
            )}

            {/* User Avatar */}
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-black">
              <span className="text-md font-medium">
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
