import mongoose, { Schema, Document } from "mongoose";

export interface IUserSignal extends Document {
  signal: string;
  symbol: string;
  quantity: number;
  confidenceScore: number;
  wasRead: boolean;
  wasTriggered: boolean;
  txHash: string;
  eventId: number;
  motivation: string;
  automationMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSignalSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    wasRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    wasTriggered: {
      type: Boolean,
      required: true,
      default: false,
    },
    automationMessage: {
      type: String,
    },
    txHash: {
      type: String,
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
UserSignalSchema.index({ symbol: 1 });

export const UserSignal = mongoose.model<IUserSignal>(
  "UserSignal",
  UserSignalSchema
);
