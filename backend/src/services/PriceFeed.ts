import { TokenPrice } from "../models/TokenPrice";

const DEFILLAMA_BASE_URL = "https://coins.llama.fi/chart";

export const tokenAddress = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  WETH: "0x4200000000000000000000000000000000000006",
  USDT: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
};

export async function getTokenPrice(symbol: keyof typeof tokenAddress) {
  const token = tokenAddress[symbol];
  const timestamp = Math.floor(Date.now() / 1000);
  const tokenString = `base:${token}`;
  const response = await fetch(
    `${DEFILLAMA_BASE_URL}/${tokenString}?span=2&end=${timestamp}`
  );
  const data: any = await response.json();
  const prices = data.coins[tokenString].prices;

  const existingToken = await TokenPrice.findOne({
    symbol,
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60) },
  });

  const currentPrice = prices[1].price;
  const oldPrice = prices[0].price;
  const priceChange24h = ((currentPrice - oldPrice) / oldPrice) * 100;

  const tokenObject = {
    symbol,
    currentPrice,
    priceChange24h,
  };

  if (!existingToken) {
    await TokenPrice.create(tokenObject);
  }

  return tokenObject;
}
