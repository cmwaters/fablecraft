import mongoose from "mongoose";
const User = mongoose.model("User");

export interface Card extends mongoose.Document {
  text: string;
  depth: number;
  index: number;
  parentIndex: number | null;
  owner: typeof User;
}

export const CardSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  depth: {
    type: Number,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  parentIndex: {
    type: Number, // not required as root cards will have no parents
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const CardModel = mongoose.model<Card>("Card", CardSchema);
