"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { BaseLayout } from "../../components/layout/base-layout";
import { cn } from "../../lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";

// Standard ERC20 ABI (only the functions we need)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Base blockchain details
const BASE_RPC_URL = "https://mainnet.base.org";

// List of known popular ERC20 tokens on Base
const KNOWN_BASE_TOKENS = [
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    name: "USD Coin",
    symbol: "USDC",
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    name: "Wrapped Ether",
    symbol: "WETH",
  },
  {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    name: "DAI Stablecoin",
    symbol: "DAI",
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    name: "USD Tether",
    symbol: "USDT",
  },
  {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    name: "Coinbase Wrapped Staked ETH",
    symbol: "cbETH",
  },
];

interface Asset {
  name: string;
  symbol: string;
  balance: string;
  address: string;
  type: "native" | "erc20";
}

export default function DashboardPage() {
  const { user, authenticated, ready } = usePrivy();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState("0.00");

  useEffect(() => {
    const fetchBaseAssets = async () => {
      if (!ready || !authenticated || !user?.wallet?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const walletAddress = user.wallet.address;

        // Connect to Base blockchain - updated for ethers v6
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

        // Get native ETH balance
        const ethBalance = await provider.getBalance(walletAddress);

        // Create array to hold all assets (starting with native ETH)
        const userAssets = [
          {
            name: "Ether",
            symbol: "ETH",
            balance: ethers.formatEther(ethBalance),
            address: "native",
            type: "native",
          },
        ];

        // Fetch ERC20 balances
        for (const token of KNOWN_BASE_TOKENS) {
          try {
            const tokenContract = new ethers.Contract(
              token.address,
              ERC20_ABI,
              provider
            );
            const balance = await tokenContract.balanceOf(walletAddress);
            const decimals = await tokenContract.decimals();

            // Only add tokens with non-zero balances
            if (balance > 0) {
              userAssets.push({
                name: token.name,
                symbol: token.symbol,
                balance: ethers.formatUnits(balance, decimals),
                address: token.address,
                type: "erc20",
              });
            }
          } catch (tokenError) {
            console.error(`Error fetching token ${token.symbol}:`, tokenError);
            // Continue with other tokens
          }
        }

        setAssets(userAssets as Asset[]);

        // For demo purposes, let's calculate a fake total
        // In a real app, you'd use price feeds to get actual USD values
        const fakeTotal = userAssets.reduce((total, asset) => {
          let value = 0;
          if (asset.symbol === "ETH") value = parseFloat(asset.balance) * 3000;
          if (
            asset.symbol === "USDC" ||
            asset.symbol === "USDT" ||
            asset.symbol === "DAI"
          )
            value = parseFloat(asset.balance);
          if (asset.symbol === "WETH") value = parseFloat(asset.balance) * 3000;
          if (asset.symbol === "cbETH")
            value = parseFloat(asset.balance) * 3200;
          return total + value;
        }, 0);

        setTotalBalance(fakeTotal.toFixed(2));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Base assets:", err);
        setError("Failed to load your assets. Please try again later.");
        setLoading(false);
      }
    };

    fetchBaseAssets();
  }, [user?.wallet?.address, authenticated, ready]);

  return (
    <BaseLayout>
      <div className="space-y-8">
        {/* Assets section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Base Assets</h2>

          {!ready ? (
            <p>Loading Privy...</p>
          ) : !authenticated ? (
            <div className="bg-card p-6 rounded-xl">
              <p>Please connect your wallet to view your assets</p>
            </div>
          ) : loading ? (
            <div className="bg-card p-6 rounded-xl">
              <p>Loading your assets...</p>
            </div>
          ) : error ? (
            <div className="bg-card p-6 rounded-xl">
              <p className="text-red-500">{error}</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-card p-6 rounded-xl">
              <p>No assets found on Base blockchain</p>
            </div>
          ) : (
            <div className="bg-card p-6 rounded-xl">
              <div className="grid grid-cols-4 font-medium text-sm text-muted-foreground pb-2 border-b">
                <div>Asset</div>
                <div className="text-right">Balance</div>
                <div className="text-right">Price</div>
                <div className="text-right">Value</div>
              </div>

              <div className="space-y-3 mt-3">
                {assets.map((asset) => (
                  <AssetRow key={asset.address} asset={asset} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  // Mock prices for demo purposes
  const getPriceForAsset = (symbol: string) => {
    switch (symbol) {
      case "ETH":
        return 3000;
      case "WETH":
        return 3000;
      case "USDC":
        return 1;
      case "USDT":
        return 1;
      case "DAI":
        return 1;
      case "cbETH":
        return 3200;
      default:
        return 0;
    }
  };

  const price = getPriceForAsset(asset.symbol);
  const value = parseFloat(asset.balance) * price;

  return (
    <div className="grid grid-cols-4 py-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          {asset.symbol.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{asset.symbol}</p>
          <p className="text-xs text-muted-foreground">{asset.name}</p>
        </div>
      </div>
      <div className="text-right self-center">
        {parseFloat(asset.balance).toFixed(6)}
      </div>
      <div className="text-right self-center">${price.toFixed(2)}</div>
      <div className="text-right self-center font-medium">
        ${value.toFixed(2)}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

function StatCard({ title, value, change, trend }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p
        className={cn(
          "mt-1 text-sm",
          trend === "up" ? "text-green-500" : "text-red-500"
        )}
      >
        {change}
      </p>
    </div>
  );
}
