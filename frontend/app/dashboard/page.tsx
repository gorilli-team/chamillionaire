"use client";

import React, { useState, useEffect } from "react";
import { BaseLayout } from "../../components/layout/base-layout";
import { cn } from "../../lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { BrowserProvider, Contract } from "ethers";

// Standard ERC20 ABI (only the functions we need)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
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

// Add VaultFactory ABI
const VAULT_FACTORY_ABI = [
  "function createVault() external returns (address)",
  "function vaults(address owner) view returns (address)",
];

const VAULT_FACTORY_ADDRESS = "0x7f9476fB4d637045dF62fdC27230fD9784D11Ad2";

// Add Vault ABI
const VAULT_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
];

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
  const [totalVaultBalance, setTotalVaultBalance] = useState("0.00");
  const [hasVault, setHasVault] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchBaseAssets = async () => {
    if (!ready || !authenticated || !user?.wallet?.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const walletAddress = user.wallet.address;
      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const ethBalance = await provider.getBalance(walletAddress);
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
        ethPrice = 3000;
      }

      const ethBalanceFormatted = ethers.formatEther(ethBalance);
      const ethValue = parseFloat(ethBalanceFormatted) * ethPrice;

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

      let vaultTotalValue = 0;

      for (const token of KNOWN_BASE_TOKENS) {
        try {
          const tokenContract = new ethers.Contract(
            token.address,
            ERC20_ABI,
            provider
          );
          const balance = await tokenContract.balanceOf(walletAddress);
          const decimals = await tokenContract.decimals();

          // Get vault balance if vault exists
          let vaultBalance = BigInt(0);
          if (vaultAddress) {
            vaultBalance = await tokenContract.balanceOf(vaultAddress);
          }

          if (balance > 0 || vaultBalance > 0) {
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
                if (["USDC", "USDT", "DAI"].includes(token.symbol)) {
                  tokenPrice = 1;
                } else if (token.symbol === "WETH") {
                  tokenPrice = ethPrice;
                } else if (token.symbol === "cbETH") {
                  tokenPrice = ethPrice * 1.05;
                }
              }
            }

            const tokenBalance = ethers.formatUnits(balance, decimals);
            const tokenValue = parseFloat(tokenBalance) * tokenPrice;

            // Calculate vault token value
            const vaultTokenBalance = ethers.formatUnits(
              vaultBalance,
              decimals
            );
            const vaultTokenValue = parseFloat(vaultTokenBalance) * tokenPrice;
            vaultTotalValue += vaultTokenValue;

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
        }
      }

      setAssets(userAssets);
      const total = userAssets.reduce((sum, asset) => sum + asset.value, 0);
      setTotalBalance(total.toFixed(2));
      setTotalVaultBalance(vaultTotalValue.toFixed(2));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching Base assets:", err);
      setError("Failed to load your assets. Please try again later.");
      setLoading(false);
    }
  };

  // Check if user has a vault
  useEffect(() => {
    const checkVault = async () => {
      if (!ready || !authenticated || !user?.wallet?.address) return;

      try {
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
        const vaultFactory = new ethers.Contract(
          VAULT_FACTORY_ADDRESS,
          VAULT_FACTORY_ABI,
          provider
        );

        const vault = await vaultFactory.vaults(user.wallet.address);
        const hasExistingVault =
          vault !== "0x0000000000000000000000000000000000000000";
        setHasVault(hasExistingVault);
        if (hasExistingVault) {
          setVaultAddress(vault);
        }
      } catch (err) {
        console.error("Error checking vault:", err);
      }
    };

    checkVault();
  }, [user?.wallet?.address, authenticated, ready]);

  const createVault = async () => {
    if (!user?.wallet?.address) return;

    try {
      setIsCreatingVault(true);
      setError(null);

      // Get provider using the BrowserProvider for web3 wallets (e.g., MetaMask, Privy)
      const provider = new BrowserProvider(window.ethereum); // Correct provider for v6
      const signer = await provider.getSigner(); // Get signer from the provider

      // Create contract instance with signer
      const vaultFactory = new Contract(
        VAULT_FACTORY_ADDRESS,
        VAULT_FACTORY_ABI,
        signer
      );

      // Create vault transaction
      const tx = await vaultFactory.createVault();
      await tx.wait();

      // Update vault status
      setHasVault(true);
    } catch (err) {
      console.error("Error creating vault:", err);
      setError("Failed to create vault. Please try again.");
    } finally {
      setIsCreatingVault(false);
    }
  };

  const handleDeposit = async (asset: Asset) => {
    if (!vaultAddress || !user?.wallet?.address || asset.type === "native")
      return;

    try {
      setIsDepositing(true);
      setError(null);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // First approve the vault to spend tokens
      const tokenContract = new Contract(asset.address, ERC20_ABI, signer);
      const amount = ethers.parseUnits(asset.balance, 18); // Assuming 18 decimals, should be dynamic in production
      console.log("amount", amount);
      //deposit only 1000000000000000000n
      const depositAmount = ethers.parseUnits("1000000000000000000", 18);
      console.log("vaultAddress", vaultAddress);
      console.log("tokenContract", tokenContract);

      const approveTx = await tokenContract.approve(
        vaultAddress,
        depositAmount
      );
      await approveTx.wait();

      // Now deposit into the vault
      const vaultContract = new Contract(vaultAddress, VAULT_ABI, signer);
      const depositTx = await vaultContract.deposit(asset.address, amount);
      await depositTx.wait();

      // Refresh assets
      fetchBaseAssets();
    } catch (err) {
      console.error("Error depositing:", err);
      setError("Failed to deposit. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (asset: Asset) => {
    if (!vaultAddress || !user?.wallet?.address || asset.type === "native")
      return;

    try {
      setIsWithdrawing(true);
      setError(null);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const vaultContract = new Contract(vaultAddress, VAULT_ABI, signer);
      const amount = ethers.parseUnits(asset.balance, 18); // Assuming 18 decimals, should be dynamic in production

      const withdrawTx = await vaultContract.withdraw(asset.address, amount);
      await withdrawTx.wait();

      // Refresh assets
      fetchBaseAssets();
    } catch (err) {
      console.error("Error withdrawing:", err);
      setError("Failed to withdraw. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    fetchBaseAssets();
  }, [user?.wallet?.address, authenticated, ready]);

  return (
    <BaseLayout>
      <div className="space-y-8 w-full px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your Base Assets
            </h1>
            <p className="text-black/50 mt-1">
              Here's an overview of your Base assets
            </p>
          </div>

          <div className="bg-[rgb(0,82,255)] backdrop-blur-sm px-4 py-1 rounded-full">
            <span className="text-sm font-semibold text-white">
              Base Network
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            value={`$${totalBalance}`}
            className="border-2 border-black/5 hover:border-black/10 transition-all"
          />
          {!hasVault ? (
            <div className="bg-white/50 backdrop-blur-xl shadow-sm rounded-2xl p-6 hover:bg-white/60 transition-all border-2 border-black/5 hover:border-black/10 flex items-center">
              <button
                className="bg-[rgb(0,82,255)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[rgb(0,82,255)]/90 shadow-md shadow-[rgb(0,82,255)]/10 backdrop-blur-xl transition-all flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={createVault}
                disabled={isCreatingVault || !authenticated}
              >
                {isCreatingVault ? "Creating..." : "Create AI Vault"}
                {!isCreatingVault && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-80"
                  >
                    <path
                      d="M12 4.5C16.1421 4.5 19.5 7.85786 19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 12H16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          ) : (
            <div className="bg-white/50 backdrop-blur-xl shadow-sm rounded-2xl p-6 hover:bg-white/60 transition-all border-2 border-black/5 hover:border-black/10">
              <p className="text-sm text-black/50">AI Vault</p>
              <p className="mt-2 text-2xl font-bold">${totalVaultBalance}</p>
              <a
                href={`https://basescan.org/address/${vaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-mono break-all flex items-center gap-1"
              >
                {vaultAddress}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 3H21V9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 14L21 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Assets section */}
        <div className="space-y-4">
          {!ready ? (
            <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
              <div className="animate-pulse">Loading Privy...</div>
            </div>
          ) : !authenticated ? (
            <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
              <p className="text-lg font-medium">
                Please connect your wallet to view your assets
              </p>
            </div>
          ) : loading ? (
            <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
              <div className="animate-pulse">Loading your assets...</div>
            </div>
          ) : error ? (
            <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="min-h-[400px] flex items-center justify-center bg-black/5 rounded-2xl backdrop-blur-sm border-2 border-black/5">
              <p className="text-lg font-medium">
                No assets found on Base blockchain
              </p>
            </div>
          ) : (
            <div className="bg-white/50 backdrop-blur-xl shadow-xl rounded-2xl border-2 border-black/5 hover:border-black/10 transition-all">
              <div
                className="grid text-sm font-medium text-black/70 p-6 border-b-2 border-black/5"
                style={{ gridTemplateColumns: "30% 20% 15% 15% 20%" }}
              >
                <div>Asset</div>
                <div className="text-right">Balance</div>
                <div className="text-right">Price</div>
                <div className="text-right">Value</div>
                <div className="text-right">Actions</div>
              </div>

              <div className="divide-y-2 divide-black/5">
                {assets.map((asset) => (
                  <AssetRow
                    key={asset.address}
                    asset={asset}
                    handleDeposit={handleDeposit}
                    handleWithdraw={handleWithdraw}
                    isDepositing={isDepositing}
                    isWithdrawing={isWithdrawing}
                    hasVault={hasVault}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
}

function AssetRow({
  asset,
  handleDeposit,
  handleWithdraw,
  isDepositing,
  isWithdrawing,
  hasVault,
}: {
  asset: Asset;
  handleDeposit: (asset: Asset) => Promise<void>;
  handleWithdraw: (asset: Asset) => Promise<void>;
  isDepositing: boolean;
  isWithdrawing: boolean;
  hasVault: boolean;
}) {
  return (
    <div
      className="grid p-6 hover:bg-black/[0.02] transition-colors"
      style={{ gridTemplateColumns: "30% 20% 15% 15% 20%" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center font-medium">
          {asset.symbol.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{asset.symbol}</p>
          <p className="text-sm text-black/50">{asset.name}</p>
        </div>
      </div>
      <div className="text-right self-center font-mono">
        {parseFloat(asset.balance).toFixed(6)}
      </div>
      <div className="text-right self-center font-mono">
        ${asset.price.toFixed(2)}
      </div>
      <div className="text-right self-center font-medium">
        ${asset.value.toFixed(2)}
      </div>
      <div className="flex justify-end gap-2 self-center">
        {asset.type === "erc20" && (
          <>
            <button
              onClick={() => handleDeposit(asset)}
              disabled={isDepositing || !hasVault}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDepositing ? "Depositing..." : "Deposit"}
            </button>
            <button
              onClick={() => handleWithdraw(asset)}
              disabled={isWithdrawing || !hasVault}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  className?: string;
}

function StatCard({ title, value, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white/50 backdrop-blur-xl shadow-sm rounded-2xl p-6 hover:bg-white/60 transition-all",
        className
      )}
    >
      <p className="text-sm text-black/50">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
