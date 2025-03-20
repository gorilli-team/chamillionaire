"use client";

import React, { useState, useEffect } from "react";
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

// Chainlink Price Feed ABI
const CHAINLINK_PRICE_FEED_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
];

// Base blockchain details
const BASE_RPC_URL = "https://mainnet.base.org";

// List of known popular ERC20 tokens on Base with price feed addresses
const KNOWN_BASE_TOKENS = [
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    name: "USD Coin",
    symbol: "USDC",
    priceFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", // USDC/USD price feed on Base
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    name: "Wrapped Ether",
    symbol: "WETH",
    priceFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD price feed on Base
  },
  {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    name: "DAI Stablecoin",
    symbol: "DAI",
    priceFeed: "0x591e79239a7d679378ec8c847e5038150364c78f", // DAI/USD price feed on Base
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    name: "USD Tether",
    symbol: "USDT",
    priceFeed: "0xf19d560eb8d2adf07bd6813f0e996fefd7f7998c", // USDT/USD price feed on Base
  },
  {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    name: "Coinbase Wrapped Staked ETH",
    symbol: "cbETH",
    priceFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Using ETH price feed as an approximation
  },
];

// ETH/USD price feed for native ETH
const ETH_USD_PRICE_FEED = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";

interface Asset {
  name: string;
  symbol: string;
  balance: string;
  address: string;
  type: "native" | "erc20";
  price: number;
  value: number;
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

        // Connect to Base blockchain
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

        // Get native ETH balance
        const ethBalance = await provider.getBalance(walletAddress);

        // Get ETH price from Chainlink
        let ethPrice = 0;
        try {
          const ethPriceFeed = new ethers.Contract(
            ETH_USD_PRICE_FEED,
            CHAINLINK_PRICE_FEED_ABI,
            provider
          );

          const [, answer, , ,] = await ethPriceFeed.latestRoundData();
          const decimals = await ethPriceFeed.decimals();
          ethPrice = parseFloat(ethers.formatUnits(answer, decimals));
        } catch (priceError) {
          console.error("Error fetching ETH price:", priceError);
          // Fallback price if oracle fails
          ethPrice = 3000;
        }

        const ethBalanceFormatted = ethers.formatEther(ethBalance);
        const ethValue = parseFloat(ethBalanceFormatted) * ethPrice;

        // Create array to hold all assets (starting with native ETH)
        const userAssets: Asset[] = [
          {
            name: "Ether",
            symbol: "ETH",
            balance: ethBalanceFormatted,
            address: "native",
            type: "native",
            price: ethPrice,
            value: ethValue,
          },
        ];

        // Fetch ERC20 balances and prices
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
              // Get token price from Chainlink if available
              let tokenPrice = 0;

              if (token.priceFeed) {
                try {
                  const priceFeed = new ethers.Contract(
                    token.priceFeed,
                    CHAINLINK_PRICE_FEED_ABI,
                    provider
                  );

                  const [, answer, , ,] = await priceFeed.latestRoundData();
                  const priceDecimals = await priceFeed.decimals();
                  tokenPrice = parseFloat(
                    ethers.formatUnits(answer, priceDecimals)
                  );
                } catch (priceError) {
                  console.error(
                    `Error fetching ${token.symbol} price:`,
                    priceError
                  );
                  // Fallback prices if oracle fails
                  if (
                    token.symbol === "USDC" ||
                    token.symbol === "USDT" ||
                    token.symbol === "DAI"
                  ) {
                    tokenPrice = 1;
                  } else if (token.symbol === "WETH") {
                    tokenPrice = ethPrice;
                  } else if (token.symbol === "cbETH") {
                    tokenPrice = ethPrice * 1.05; // Slight premium for staked ETH
                  }
                }
              }

              const tokenBalance = ethers.formatUnits(balance, decimals);
              const tokenValue = parseFloat(tokenBalance) * tokenPrice;

              userAssets.push({
                name: token.name,
                symbol: token.symbol,
                balance: tokenBalance,
                address: token.address,
                type: "erc20",
                price: tokenPrice,
                value: tokenValue,
              });
            }
          } catch (tokenError) {
            console.error(`Error fetching token ${token.symbol}:`, tokenError);
            // Continue with other tokens
          }
        }

        setAssets(userAssets);

        // Calculate total balance from all assets
        const total = userAssets.reduce((sum, asset) => sum + asset.value, 0);
        setTotalBalance(total.toFixed(2));

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
        <div>
          <h1 className="text-3xl font-bold">Your Base Assets</h1>
          <p className="text-muted-foreground">
            Here's an overview of your Base assets
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            value={`$${totalBalance}`}
            // change="+2.5%"
            // trend="up"
          />
          {/* <StatCard
            title="24h Volume"
            value="$12,234.00"
            // change="-0.8%"
            // trend="down"
          /> */}
          {/* <StatCard
            title="Active Trades"
            value="8"
            // change="+1"
            // trend="up"
          /> */}
          {/* <StatCard
            title="Success Rate"
            value="92%"
            // change="+2.3%"
            // trend="up"
          /> */}
        </div>

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
      <div className="text-right self-center">${asset.price.toFixed(2)}</div>
      <div className="text-right self-center font-medium">
        ${asset.value.toFixed(2)}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  // change: string;
  // trend: "up" | "down";
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {/* <p
        className={cn(
          "mt-1 text-sm",
          trend === "up" ? "text-green-500" : "text-red-500"
        )}
      >
        {change}
      </p> */}
    </div>
  );
}
