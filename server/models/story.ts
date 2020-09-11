import mongoose from "mongoose";
// const Card = mongoose.model("Card");
// const User = mongoose.model("User");
import { Card } from './card'
import { User } from './user' 
export interface Story extends mongoose.Document {
    title: string;
    description?: string;
    cards: Card[];
    owner: User;
    authors: User[];
    editors: User[];
    viewers: User[];
}

const StorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    cards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card"
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    authors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    editors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

export const StoryModel = mongoose.model<Story>("Story", StorySchema);
