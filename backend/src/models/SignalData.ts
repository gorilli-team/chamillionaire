import mongoose, { Schema, Document } from "mongoose";

export interface ISignalData extends Document {
  symbol: string;
  currentPrice: number;
  priceChange1h: number;
  createdAt: Date;
  updatedAt: Date;
}

const SignalDataSchema: Schema = new Schema(
  {
    signal: {
      type: String,
      required: true,
      enum: ["BUY", "SELL"],
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    eventId: {
      type: Number,
      required: true,
    },
    motivation: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SignalDataSchema.index({ symbol: 1 });

export const SignalData = mongoose.model<ISignalData>(
  "SignalData",
  SignalDataSchema
);
