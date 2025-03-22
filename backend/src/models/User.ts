import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  address: string;
  lastSignIn: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    address: {
      type: String,
    },
    lastSignIn: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserSchema.index({ address: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
