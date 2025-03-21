import { TokenPrice } from "../models/TokenPrice";

const DEFILLAMA_BASE_URL = "https://coins.llama.fi/chart";

export const tokenAddress = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  WETH: "0x4200000000000000000000000000000000000006",
  USDT: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
  WBTC: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
  OM: "0x3992B27dA26848C2b19CeA6Fd25ad5568B68AB98",
  AAVE: "0x63706e401c06ac8513145b7687A14804d17f814b",
};

export async function getTokenPrice(symbol: keyof typeof tokenAddress) {
  const token = tokenAddress[symbol];
  const timestamp = Math.floor(Date.now() / 1000);
  const tokenString = `base:${token}`;
  const response = await fetch(
    `${DEFILLAMA_BASE_URL}/${tokenString}?span=2&period=1h&end=${timestamp}`
  );
  const data: any = await response.json();
  const prices = data.coins[tokenString].prices;

  const existingToken = await TokenPrice.findOne({
    symbol,
    createdAt: { $gte: new Date(Date.now() - 1000 * (60 * 5 - 1)) },
  });

  const currentPrice = prices[1].price;
  const oldPrice = prices[0].price;
  const priceChange1h = ((currentPrice - oldPrice) / oldPrice) * 100;

  const tokenObject = {
    symbol,
    currentPrice,
    priceChange1h,
  };

  if (!existingToken) {
    await TokenPrice.create(tokenObject);
  }

  return tokenObject;
}
