import { getTokenPrice, tokenAddress } from "../services/PriceFeed";
import cron from "node-cron";

console.log("Initializing price update cron job...");
cron.schedule("*/5 * * * *", async () => {
  for (const token of Object.keys(tokenAddress)) {
    console.log(`Fetching price for ${token}`);
    try {
      await getTokenPrice(token as keyof typeof tokenAddress);
    } catch (error) {
      console.error(`Error fetching price for ${token}: ${error}`);
    }
    console.log(`Price fetched for ${token}`);
  }
});
