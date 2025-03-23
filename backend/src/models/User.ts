import mongoose, { Schema, Document } from "mongoose";

export enum AllowedToken {
  AAVE = "AAVE",
  USDC = "USDC",
  OM = "OM",
}

export interface IUser extends Document {
  address: string;
  automationEnabled: boolean;
  automationPairs: { from: AllowedToken; to: AllowedToken }[];
  maxTradeSize: number;
  lastSignIn: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lastSignIn: {
      type: Date,
    },
    automationEnabled: {
      type: Boolean,
      default: false,
    },
    maxTradeSize: {
      type: Number,
      default: 100,
      min: 0,
    },
    automationPairs: [
      {
        from: {
          type: String,
          enum: Object.values(AllowedToken),
          required: true,
        },
        to: {
          type: String,
          enum: Object.values(AllowedToken),
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserSchema.index({ address: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
