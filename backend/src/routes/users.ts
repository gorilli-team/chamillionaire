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

router.get("/me", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "No address provided" });
    }
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
