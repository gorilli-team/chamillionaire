import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  address: string;
  automationEnabled: boolean;
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserSchema.index({ address: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
