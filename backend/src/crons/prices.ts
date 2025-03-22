import { getTokenPrice } from "../services/PriceFeed";
import { symbolToTokenInfo } from "../services/0x";
import cron from "node-cron";

console.log("Initializing price update cron job...");
cron.schedule("*/5 * * * *", async () => {
  console.log("Fetching prices... " + new Date().toISOString());
  for (const token of Object.keys(symbolToTokenInfo)) {
    console.log(`Fetching price for ${token}`);
    try {
      await getTokenPrice(token as keyof typeof symbolToTokenInfo);
    } catch (error) {
      console.error(`Error fetching price for ${token}: ${error}`);
    }
    console.log(`Price fetched for ${token}`);
  }
});
