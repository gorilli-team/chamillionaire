import mongoose, { Schema, Document } from "mongoose";

export interface ITokenPrice extends Document {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

const TokenPriceSchema: Schema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceChange24h: {
      type: Number,
      required: true,
    },
    // volume24h: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },
    // marketCap: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Index for faster queries
TokenPriceSchema.index({ symbol: 1 });

export const TokenPrice = mongoose.model<ITokenPrice>(
  "TokenPrice",
  TokenPriceSchema
);
