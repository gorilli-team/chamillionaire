"use client";

import React, { useState, useEffect, useRef } from "react";
import { BaseLayout } from "../../components/layout/base-layout";
import { cn } from "../../lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { BrowserProvider, Contract } from "ethers";
import { useVoice } from "../../components/voice/useVoice";
import { SpeakingDialog } from "../../components/voice/SpeakingDialog";

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
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png",
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    name: "Wrapped Ether",
    symbol: "WETH",
    priceFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD price feed on Base
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x4200000000000000000000000000000000000006/logo.png",
  },
  {
    address: "0x63706e401c06ac8513145b7687A14804d17f814b",
    name: "AAVE",
    symbol: "AAVE",
    priceFeed: "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9", // AAVE/USD price feed on Base
    icon: "https://app.aave.com/icons/tokens/aave.svg",
  },
  {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    name: "DAI Stablecoin",
    symbol: "DAI",
    priceFeed: "0x591e79239a7d679378ec8c847e5038150364c78f", // DAI/USD price feed on Base
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png",
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    name: "USD Tether",
    symbol: "USDT",
    priceFeed: "0xf19d560eb8d2adf07bd6813f0e996fefd7f7998c", // USDT/USD price feed on Base
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA/logo.png",
  },
  {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    name: "Coinbase Wrapped Staked ETH",
    symbol: "cbETH",
    priceFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Using ETH price feed as an approximation
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22/logo.png",
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
  decimals?: number;
  vaultBalance?: string;
  icon?: string;
}

function DepositDialog({
  isOpen,
  onClose,
  onConfirm,
  asset,
  maxAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => void;
  asset: Asset;
  maxAmount: string;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);

    if (Number(value) > Number(maxAmount)) {
      setError("Amount exceeds balance");
    } else if (Number(value) <= 0) {
      setError("Amount must be greater than 0");
    } else {
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (
      error ||
      !amount ||
      Number(amount) <= 0 ||
      Number(amount) > Number(maxAmount)
    ) {
      return;
    }
    onConfirm(amount);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-96 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold">Deposit {asset.symbol}</h3>
          <div className="space-y-2">
            <label className="text-sm text-black/50">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                min="0"
                step="any"
                className="w-full p-2 border-2 border-black/10 rounded-lg bg-white"
              />
              <button
                onClick={() => {
                  setAmount(maxAmount);
                  setError(null);
                }}
                className="absolute right-2 top-2 text-sm text-blue-500 hover:text-blue-600"
              >
                Max
              </button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-black/50">
                Max: {maxAmount} {asset.symbol}
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-black/50 hover:text-black"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!!error || !amount || Number(amount) <= 0}
              className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Deposit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function WithdrawDialog({
  isOpen,
  onClose,
  onConfirm,
  asset,
  maxAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => void;
  asset: Asset;
  maxAmount: string;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);

    if (Number(value) > Number(maxAmount)) {
      setError("Amount exceeds vault balance");
    } else if (Number(value) <= 0) {
      setError("Amount must be greater than 0");
    } else {
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (
      error ||
      !amount ||
      Number(amount) <= 0 ||
      Number(amount) > Number(maxAmount)
    ) {
      return;
    }
    onConfirm(amount);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-96 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold">Withdraw {asset.symbol}</h3>
          <div className="space-y-2">
            <label className="text-sm text-black/50">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                min="0"
                step="any"
                className="w-full p-2 border-2 border-black/10 rounded-lg bg-white"
              />
              <button
                onClick={() => {
                  setAmount(maxAmount);
                  setError(null);
                }}
                className="absolute right-2 top-2 text-sm text-blue-500 hover:text-blue-600"
              >
                Max
              </button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-black/50">
                Max: {maxAmount} {asset.symbol}
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-black/50 hover:text-black"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!!error || !amount || Number(amount) <= 0}
              className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Withdraw
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user, authenticated, ready } = usePrivy();
  const messagesReadRef = useRef(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [totalVaultBalance, setTotalVaultBalance] = useState("0.00");
  const [hasVault, setHasVault] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  const { isSpeaking, currentMessage, speak, stopSpeaking } = useVoice();

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
          console.log("vaultAddress", vaultAddress);
          if (vaultAddress) {
            console.log(`\nChecking vault balance for ${token.symbol}:`);
            console.log(`- Token address: ${token.address}`);
            console.log(`- Vault address: ${vaultAddress}`);
            try {
              vaultBalance = await tokenContract.balanceOf(vaultAddress);
              console.log(`- Raw vault balance: ${vaultBalance.toString()}`);
              const formattedVaultBalance = ethers.formatUnits(
                vaultBalance,
                decimals
              );
              console.log(
                `- Formatted vault balance: ${formattedVaultBalance}`
              );
              console.log(`- Token decimals: ${decimals}`);
            } catch (vaultError) {
              console.error(
                `Error checking vault balance for ${token.symbol}:`,
                vaultError
              );
            }
          }

          // Always process token if there's a vault balance, even if wallet balance is 0
          // For AAVE, always process regardless of balance
          if (
            // token.symbol === "AAVE" ||
            balance > 0 ||
            vaultBalance > BigInt(0)
          ) {
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
                console.log(`Price for ${token.symbol}:`, tokenPrice);
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
                } else if (token.symbol === "AAVE") {
                  try {
                    // Fetch AAVE price from DefiLlama
                    const response = await fetch(
                      `https://coins.llama.fi/chart/base:${token.address}?span=1&period=1h`
                    );
                    const data = await response.json();
                    const prices = data.coins[`base:${token.address}`].prices;
                    tokenPrice = prices[prices.length - 1].price;
                    console.log("AAVE price from DefiLlama:", tokenPrice);
                  } catch (defiLlamaError) {
                    console.error(
                      "Error fetching AAVE price from DefiLlama:",
                      defiLlamaError
                    );
                    tokenPrice = 185; // Fallback price
                  }
                }
              }
            }

            const tokenBalance = ethers.formatUnits(balance, decimals);
            const tokenValue = parseFloat(tokenBalance) * tokenPrice;

            console.log(`${token.symbol} token stats:`, {
              balance: tokenBalance,
              price: tokenPrice,
              value: tokenValue,
            });

            // Calculate vault token value
            const vaultTokenBalance = ethers.formatUnits(
              vaultBalance,
              decimals
            );

            const vaultTokenValue = parseFloat(vaultTokenBalance) * tokenPrice;
            console.log(`${token.symbol} vault stats:`, {
              balance: vaultTokenBalance,
              price: tokenPrice,
              value: vaultTokenValue,
            });
            vaultTotalValue += vaultTokenValue;

            userAssets.push({
              name: token.name,
              symbol: token.symbol,
              balance: tokenBalance,
              address: token.address,
              type: "erc20",
              price: tokenPrice,
              value: tokenValue,
              decimals: decimals,
              vaultBalance: vaultTokenBalance,
              icon: token.icon,
            });
          }
        } catch (tokenError) {
          console.error(`Error fetching token ${token.symbol}:`, tokenError);
        }
      }

      setAssets(userAssets);
      const walletTotal = userAssets.reduce(
        (sum, asset) => sum + asset.value,
        0
      );
      setWalletBalance(walletTotal.toFixed(2));
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
      const receipt = await tx.wait();

      // Get the new vault address
      const vault = await vaultFactory.vaults(user.wallet.address);
      setVaultAddress(vault);

      // Update vault status
      setHasVault(true);
    } catch (err) {
      console.error("Error creating vault:", err);
      setError("Failed to create vault. Please try again.");
    } finally {
      setIsCreatingVault(false);
    }
  };

  const handleDepositClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDepositDialogOpen(true);
  };

  const handleDepositConfirm = async (amount: string) => {
    if (!selectedAsset) return;
    setIsDepositDialogOpen(false);
    await handleDeposit(selectedAsset, amount);
  };

  const handleDeposit = async (asset: Asset, depositAmount: string) => {
    if (!vaultAddress || !user?.wallet?.address || asset.type === "native")
      return;

    try {
      setIsDepositing(true);
      setError(null);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // First approve the vault to spend tokens
      const tokenContract = new Contract(asset.address, ERC20_ABI, signer);
      const decimals = asset.decimals || 18;
      const amount = ethers.parseUnits(depositAmount, decimals);

      const approveTx = await tokenContract.approve(vaultAddress, amount);
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

  const handleWithdrawClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsWithdrawDialogOpen(true);
  };

  const handleWithdrawConfirm = async (amount: string) => {
    if (!selectedAsset) return;
    setIsWithdrawDialogOpen(false);
    await handleWithdraw(selectedAsset, amount);
  };

  const handleWithdraw = async (asset: Asset, withdrawAmount: string) => {
    if (!vaultAddress || !user?.wallet?.address || asset.type === "native")
      return;

    try {
      setIsWithdrawing(true);
      setError(null);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const vaultContract = new Contract(vaultAddress, VAULT_ABI, signer);
      const decimals = asset.decimals || 18;
      const amount = ethers.parseUnits(withdrawAmount, decimals);

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
  }, [user?.wallet?.address, authenticated, ready, vaultAddress]);

  const getUpdateMessages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-signals/messagesToRead?address=${user?.wallet?.address}`
      );
      const data = await response.json();
      console.log("data", data.length);
      return data;
    } catch (error) {
      console.error("Error fetching update messages:", error);
      return [];
    }
  };

  const markAsRead = async (signalId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-signals/markAsRead`,
        {
          method: "POST",
          body: JSON.stringify({ signalId }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log("data", data);
    } catch (error) {
      console.error("Error marking signal as read:", error);
    }
  };

  useEffect(() => {
    const fetchMessage = async () => {
      if (authenticated && !messagesReadRef.current) {
        messagesReadRef.current = true;
        const messages = await getUpdateMessages();
        if (messages) {
          for (const message of messages) {
            const date = new Date(message.createdAt);
            const formattedDate = date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const truncatedMotivation =
              message.motivation.length > 100
                ? message.motivation.substring(0, 300) + "..."
                : message.motivation;
            const messageText = `[${formattedDate}] ${truncatedMotivation}`;
            await speak(messageText);
            await markAsRead(message._id);
          }
        }
      }
    };
    fetchMessage();
  }, [authenticated]);

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
            value={`$${(
              Number(walletBalance) + Number(totalVaultBalance)
            ).toFixed(2)}`}
            className="border-2 border-black/5 hover:border-black/10 transition-all"
          />

          <StatCard
            title="Wallet Balance"
            value={`$${walletBalance}`}
            className="border-2 border-black/5 hover:border-black/10 transition-all"
          />
          {!hasVault ? (
            <div className="bg-white/50 backdrop-blur-xl shadow-sm rounded-2xl p-6 hover:bg-white/60 transition-all border-2 border-black/5 hover:border-black/10 flex items-center">
              <button
                className="bg-[rgb(0,82,255)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[rgb(0,82,255)]/90 shadow-md shadow-[rgb(0,82,255)]/10 backdrop-blur-xl transition-all flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={createVault}
                disabled={isCreatingVault || !authenticated}
              >
                {isCreatingVault ? "Creating..." : "Create AI Escrow"}
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
              <p className="text-sm text-black/50">AI Escrow Balance</p>
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
                style={{
                  gridTemplateColumns: "20% 15% 15% 12.5% 12.5% 12.5% 12.5%",
                }}
              >
                <div>Asset</div>
                <div className="text-right">Balance in Wallet</div>
                <div className="text-right">Balance in AI Escrow</div>
                <div className="text-right">Price</div>
                <div className="text-right">Total Value</div>
                <div className="text-right">Deposit</div>
                <div className="text-right">Withdraw</div>
              </div>

              <div className="divide-y-2 divide-black/5">
                {assets.map((asset) => (
                  <div
                    key={asset.address}
                    className="grid p-6 hover:bg-black/[0.02] transition-colors"
                    style={{
                      gridTemplateColumns:
                        "20% 15% 15% 12.5% 12.5% 12.5% 12.5%",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/50">
                        {asset.type === "native" ? (
                          <img
                            src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"
                            alt="ETH"
                            className="w-full h-full object-contain"
                          />
                        ) : asset.icon ? (
                          <img
                            src={asset.icon}
                            alt={asset.symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${asset.address}/logo.png`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-black/5 flex items-center justify-center font-medium">
                            {asset.symbol.charAt(0)}
                          </div>
                        )}
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
                      {asset.vaultBalance
                        ? parseFloat(asset.vaultBalance).toFixed(6)
                        : "0.000000"}
                    </div>
                    <div className="text-right self-center font-mono">
                      ${asset.price.toFixed(2)}
                    </div>
                    <div className="text-right self-center font-mono">
                      $
                      {(
                        (parseFloat(asset.balance) +
                          parseFloat(asset.vaultBalance || "0")) *
                        asset.price
                      ).toFixed(2)}
                    </div>
                    <div className="flex justify-end self-center">
                      {asset.type === "erc20" && asset.balance !== "0.0" && (
                        <button
                          onClick={() => handleDepositClick(asset)}
                          disabled={isDepositing || !hasVault}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDepositing ? "Depositing..." : "Deposit"}
                        </button>
                      )}
                    </div>
                    <div className="flex justify-end self-center">
                      {asset.type === "erc20" &&
                        asset.vaultBalance &&
                        asset.vaultBalance !== "0.0" && (
                          <button
                            onClick={() => handleWithdrawClick(asset)}
                            disabled={isWithdrawing || !hasVault}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isWithdrawing ? "Withdrawing..." : "Withdraw "}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {selectedAsset && (
          <>
            <DepositDialog
              isOpen={isDepositDialogOpen}
              onClose={() => setIsDepositDialogOpen(false)}
              onConfirm={handleDepositConfirm}
              asset={selectedAsset}
              maxAmount={selectedAsset.balance}
            />
            <WithdrawDialog
              isOpen={isWithdrawDialogOpen}
              onClose={() => setIsWithdrawDialogOpen(false)}
              onConfirm={handleWithdrawConfirm}
              asset={selectedAsset}
              maxAmount={selectedAsset.vaultBalance || "0"}
            />
          </>
        )}
      </div>
      {authenticated && (
        <SpeakingDialog
          isSpeaking={isSpeaking}
          currentMessage={currentMessage}
          onClose={stopSpeaking}
        />
      )}
    </BaseLayout>
  );
}

function StatCard({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className?: string;
}) {
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
