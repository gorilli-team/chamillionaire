import express from "express";
import { SignalData } from "../models/SignalData";
import { UserSignal } from "../models/UserSignal";
import { User } from "../models/User";
const router = express.Router();

// Create a new signal
router.post("/", async (req, res) => {
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

  /*
  Create a new user signal for each user  signal: string;
  symbol: string;
  quantity: number;
  confidenceScore: number;
  wasRead: boolean;
  wasTriggered: boolean;
  txHash: string;
  eventId: number;
  motivation: string;
  createdAt: Date;
  updatedAt: Date;
  */

  //get all users
  const users = await User.find();
  users.forEach(async (user) => {
    console.log("user", user);
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
  });

  res.status(201).json(signalData);
});

// Get all signals
router.get("/", async (req, res) => {
  const signals = await SignalData.find().sort({ createdAt: -1 });
  res.json(signals);
});

export default router;
