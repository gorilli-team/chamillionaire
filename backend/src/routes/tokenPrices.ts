import express from "express";
import { getTokenPrice } from "../services/PriceFeed";
import { TokenPrice } from "../models/TokenPrice";
const router = express.Router();

// Get token price by symbol
router.get("/token/:symbol", async (req, res) => {
  try {
    console.log(req.params.symbol);
    const tokenPrice = await getTokenPrice(req.params.symbol);
    if (!tokenPrice) {
      return res.status(400).json({ message: "Invalid token symbol" });
    }
    res.json(tokenPrice);
  } catch (error) {
    res.status(500).json({ message: "Error fetching token price", error });
  }
});

router.get("/last24h", async (req, res) => {
  try {
    const tokenPrices = await TokenPrice.find({
      createdAt: { $gte: new Date(Date.now() - 1000 * (60 * 60 * 24 - 1)) },
    }).sort({ createdAt: -1 });
    res.json(tokenPrices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching token prices", error });
  }
});

export default router;
