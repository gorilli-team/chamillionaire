import mongoose, { Schema, Document } from "mongoose";

export interface ITokenPrice extends Document {
  symbol: string;
  // name: string;
  currentPrice: number;
  priceChange1h: number;
  // volume24h: number;
  // marketCap: number;
  // lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
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
    priceChange1h: {
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
    timestamps: true,
  }
);

// Index for faster queries
TokenPriceSchema.index({ symbol: 1 });

export const TokenPrice = mongoose.model<ITokenPrice>(
  "TokenPrice",
  TokenPriceSchema
);
