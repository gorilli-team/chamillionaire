import express from "express";
import { User } from "../models/User";
const router = express.Router();

//track user signin
router.post("/signin", async (req, res) => {
  try {
    console.log("signin", req.body);
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "No address provided" });
    }

    console.log("address.toLowerCase()", address.toLowerCase());

    const user = await User.findOne({ address: address.toLowerCase() });

    if (!user) {
      //create user
      const newUser = new User({
        address: address.toLowerCase(),
        lastSignIn: new Date(),
      });
      await newUser.save();
      res.json({ message: "User activity created" });
    } else {
      //update user activity
      user.lastSignIn = new Date();
      await user.save();
      res.json({ message: "User activity updated" });
    }
  } catch (error) {
    console.error("Error signing in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/automation", async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { address, automationEnabled } = req.body;
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    user.automationEnabled = automationEnabled;
    await user.save();
    res.json({ message: "Automation status updated" });
  } catch (error) {
    console.error("Error updating automation status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/automation/pairs", async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { address, pairs } = req.body;
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    user.automationPairs = pairs;
    await user.save();
    res.json({ message: "Automation pairs updated" });
  } catch (error) {
    console.error("Error updating automation pairs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", async (req, res) => {
  try {
    console.log("-me: req.query", req.query);
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "No address provided" });
    }
    const userAddress = address as string;
    const user = await User.findOne({ address: userAddress.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/settings", async (req, res) => {
  try {
    const { address, maxTradeSize } = req.body;
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    user.maxTradeSize = maxTradeSize;
    await user.save();
    res.json({ message: "Settings updated" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
