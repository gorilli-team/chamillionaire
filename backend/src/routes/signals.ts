import express from "express";
import { SignalData } from "../models/SignalData";
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
  res.status(201).json(signalData);
});

// Get all signals
router.get("/", async (req, res) => {
  const signals = await SignalData.find();
  res.json(signals);
});

export default router;
