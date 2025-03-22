import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import tokenPriceRoutes from "./routes/tokenPrices";
import signalRoutes from "./routes/signals";
import userRoutes from "./routes/users";
import "./crons/prices";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/token-prices", tokenPriceRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/users", userRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING || "")
  .then(() => {
    console.log("Connected to MongoDB");
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
