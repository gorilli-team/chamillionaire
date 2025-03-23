import { ethers } from "ethers";

const BASE_CHAIN_ID = 8453;

export const symbolToTokenInfo: Record<
  string,
  { address: string; decimals: number }
> = {
  // ETH: {
  //   address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  //   decimals: 18,
  // },
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  // WETH: {
  //   address: "0x4200000000000000000000000000000000000006",
  //   decimals: 18,
  // },
  // USDT: {
  //   address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  //   decimals: 6,
  // },
  // DAI: {
  //   address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  //   decimals: 18,
  // },
  // cbETH: {
  //   address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
  //   decimals: 18,
  // },
  // WBTC: {
  //   address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
  //   decimals: 8,
  // },
  // OM: {
  //   address: "0x3992B27dA26848C2b19CeA6Fd25ad5568B68AB98",
  //   decimals: 18,
  // },
  AAVE: {
    address: "0x63706e401c06ac8513145b7687A14804d17f814b",
    decimals: 18,
  },
};

async function buildPriceRequest(
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amount: number,
  taker: string
) {
  const fromTokenInfo = symbolToTokenInfo[fromTokenSymbol];
  const toTokenInfo = symbolToTokenInfo[toTokenSymbol];

  const priceParams = new URLSearchParams({
    chainId: BASE_CHAIN_ID.toString(),
    sellToken: fromTokenInfo.address,
    buyToken: toTokenInfo.address,
    sellAmount: ethers
      .parseUnits(
        amount.toFixed(fromTokenInfo.decimals),
        fromTokenInfo.decimals
      )
      .toString(),
    taker: taker,
  });

  const headers = {
    "0x-api-key": process.env.ZEROX_API_KEY!,
    "0x-version": "v2",
  };

  return { priceParams, headers };
}

export async function getQuote(
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amount: number,
  taker: string
) {
  const { priceParams, headers } = await buildPriceRequest(
    fromTokenSymbol,
    toTokenSymbol,
    amount,
    taker
  );

  const priceResponse = await fetch(
    "https://api.0x.org/swap/allowance-holder/quote?" + priceParams.toString(),
    { headers }
  );

  const res: any = await priceResponse.json();
  if (!res.transaction) {
    throw new Error("No transaction data found");
  }

  // Get the fromTokenAddress from our mapping
  const fromTokenInfo = symbolToTokenInfo[fromTokenSymbol];
  if (!fromTokenInfo) {
    throw new Error(`Token symbol ${fromTokenSymbol} not found in mapping`);
  }

  return {
    transaction: res.transaction,
    fromTokenAddress: fromTokenInfo.address,
  };
}
