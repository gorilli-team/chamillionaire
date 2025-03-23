import express from "express";
import { UserSignal } from "../models/UserSignal";
import { User } from "../models/User";
const router = express.Router();

// Get messages to read for a user
router.get("/messagesToRead", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "No address provided" });
    }

    // First find the user by address
    const user = await User.findOne({
      address: address.toString().toLowerCase(),
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Then find signals using the user's ObjectId
    const signals = await UserSignal.find({
      user: user._id,
      wasRead: false,
    }).sort({ createdAt: -1 });

    res.json(signals);
  } catch (error) {
    console.error("Error fetching user signals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
