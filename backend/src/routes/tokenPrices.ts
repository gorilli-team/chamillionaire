import express from "express";
import { getTokenPrice, tokenAddress } from "../services/PriceFeed";
const router = express.Router();

// Get token price by symbol
router.get("/:symbol", async (req, res) => {
  try {
    console.log(req.params.symbol);
    if (!Object.keys(tokenAddress).includes(req.params.symbol)) {
      return res.status(400).json({ message: "Invalid token symbol" });
    }

    const tokenPrice = await getTokenPrice(
      req.params.symbol as keyof typeof tokenAddress
    );
    res.json(tokenPrice);
  } catch (error) {
    res.status(500).json({ message: "Error fetching token price", error });
  }
});

export default router;
