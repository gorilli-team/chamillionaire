import express from "express";
import { SignalData } from "../models/SignalData";
import { UserSignal } from "../models/UserSignal";
import { User } from "../models/User";
import { executeSwap } from "../services/ContractExecution";
const router = express.Router();

// Create a new signal
router.post("/", async (req, res) => {
  try {
    const { signal, symbol, quantity, confidenceScore, eventId, motivation } =
      req.body;

    if (
      !signal ||
      !symbol ||
      !quantity ||
      !confidenceScore ||
      !eventId ||
      !motivation
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("Received signal:", req.body);

    const signalData = new SignalData({
      signal,
      symbol,
      quantity,
      confidenceScore,
      eventId,
      motivation,
    });
    await signalData.save();

    //get all users
    const users = await User.find();

    // Process all users in parallel with proper error handling
    await Promise.all(
      users.map(async (user) => {
        try {
          console.log("Processing user:", user.address);
          const userSignal = new UserSignal({
            user: user._id,
            signal: signal,
            symbol: symbol,
            quantity: quantity,
            confidenceScore: confidenceScore,
            eventId: eventId,
            motivation: motivation,
          });
          await userSignal.save();

          //execute swap
          console.log(
            "Executing swap for user:",
            user.address,
            "USDC",
            symbol,
            quantity
          );
          if (user.automationEnabled) {
            if (
              user.automationPairs.some(
                (pair) => pair.from === "USDC" && pair.to === symbol
              )
            ) {
              await executeSwap("USDC", symbol, quantity, user.address);
            }
          } else {
            userSignal.automationMessage =
              "Automation not enabled on this account";
            await userSignal.save();
          }
        } catch (error) {
          console.error(`Error processing user ${user.address}:`, error);
          // Continue with other users even if one fails
        }
      })
    );

    res.status(201).json(signalData);
  } catch (error) {
    console.error("Error creating signal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all signals
router.get("/", async (req, res) => {
  const signals = await SignalData.find().sort({ createdAt: -1 });
  res.json(signals);
});

export default router;
