import mongoose from "mongoose";

export interface User extends mongoose.Document {
  email: string;
  password: string;
  name?: string;
}

export const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    // this is a hash of the actual users password
    type: String,
    required: true,
  },
  name: String,
});

export const UserModel = mongoose.model<User>("User", UserSchema);
