import mongoose from "mongoose";
const User = mongoose.model("User");

export interface Card extends mongoose.Document {
    uid: number;
    text: string;
    depth: number;
    index: number;
    owner: typeof User;
}

const CardSchema = new mongoose.Schema({
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

export const CardModel = mongoose.model<Card>("Card", CardSchema);
