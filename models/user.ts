import mongoose from "mongoose";
import { Story } from './story'

export interface User extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  stories: Story[]
}

export const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    // unique: true,
    lowercase: true,
  },
  password: {
    // this is a hash of the actual users password
    type: String,
    required: true,
  },
  name: String,
  stories: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Story"
  }]
});

export const UserModel = mongoose.model<User>("User", UserSchema);
