import { TokenPrice } from "../models/TokenPrice";
import { symbolToTokenInfo } from "./0x";

const DEFILLAMA_BASE_URL = "https://coins.llama.fi/chart";

export async function getTokenPrice(symbol: keyof typeof symbolToTokenInfo) {
  const tokenInfo = symbolToTokenInfo[symbol];
  const timestamp = Math.floor(Date.now() / 1000);
  const tokenString = `base:${tokenInfo.address}`;
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
