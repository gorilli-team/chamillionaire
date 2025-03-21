"use client";

import React, { useState, useEffect } from "react";
import { BaseLayout } from "../../../components/layout/base-layout";
import { cn } from "../../../lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { Button } from "../../../components/ui/button";
import { formatDistanceToNow } from "date-fns";

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

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
}

const ITEMS_PER_PAGE = 10;
const BASE_SCAN_URL = "https://basescan.org";

export default function DashboardPage() {
  const { user, authenticated, ready } = usePrivy();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState("0.00");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const walletAddress = user?.wallet?.address?.toLowerCase() || "";

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

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!ready || !authenticated || !walletAddress) {
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
  
        const API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY;
        const BASESCAN_URL = `https://api.basescan.org/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`;
  
        const response = await fetch(BASESCAN_URL);
        const data = await response.json();
  
        if (data.status !== "1") {
          throw new Error(data.message || "Failed to fetch transactions");
        }
  
        const formattedTxs = data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to || "Contract Creation",
          value: ethers.formatEther(tx.value),
          timestamp: parseInt(tx.timeStamp, 10) * 1000, // Convert Unix timestamp to milliseconds
        }));
  
        console.log("Formatted Transactions:", formattedTxs);
  
        // Update transactions state
        setTransactions((prev) =>
          currentPage === 1 ? formattedTxs : [...prev, ...formattedTxs]
        );
  
        setHasMore(formattedTxs.length === ITEMS_PER_PAGE);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          "Failed to load your transaction history. Please try again later."
        );
        setLoading(false);
      }
    };
  
    fetchTransactions();
  }, [walletAddress, authenticated, ready, currentPage]);
  

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  return (
    <BaseLayout>
      <div className="space-y-8">
        {/* Transaction history section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Transaction History</h2>

          {!ready ? (
            <p>Loading Privy...</p>
          ) : !authenticated ? (
            <div className="bg-card p-6 rounded-xl">
              <p>Please connect your wallet to view your transaction history</p>
            </div>
          ) : loading && transactions.length === 0 ? (
            <div className="bg-card p-6 rounded-xl">
              <p>Loading your transactions...</p>
            </div>
          ) : error ? (
            <div className="bg-card p-6 rounded-xl">
              <p className="text-red-500">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-card p-6 rounded-xl">
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="bg-card p-6 rounded-xl">
              <div className="grid grid-cols-4 font-medium text-sm text-muted-foreground pb-2 border-b">
                <div>Transaction</div>
                <div>From/To</div>
                <div className="text-right">Amount (ETH)</div>
                <div className="text-right">Time</div>
              </div>

              <div className="space-y-3 mt-3">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="grid grid-cols-4 py-2">
                    <div className="flex items-center">
                      <a
                        href={`${BASE_SCAN_URL}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                      </a>
                    </div>
                    <div className="truncate">
                      {tx.from.toLowerCase() === walletAddress ? (
                        <span className="text-red-500">
                          To: {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                        </span>
                      ) : (
                        <span className="text-green-500">
                          From: {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      {parseFloat(tx.value).toFixed(6)}
                    </div>
                    <div className="text-right text-muted-foreground">
                      {formatDistanceToNow(tx.timestamp * 1000, {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
}
