import express from "express";
import { getTokenPrice } from "../services/PriceFeed";
const router = express.Router();

// Get token price by symbol
router.get("/:symbol", async (req, res) => {
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

export default router;
