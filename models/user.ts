import mongoose from "mongoose";
import { Story } from "./story";

export interface User extends mongoose.Document {
    email: string;
    password: string;
    name: string;
    stories: Story[];
    lastStory: any;
}

export const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    // this is used for authentication and as a backup when the user has lost
    // their password
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
    stories: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Story",
        },
    ],
    // this is the last story that the user interacted with. It is
    // used when the user starts a new session.
    lastStory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
    },
});

export const UserModel = mongoose.model<User>("User", UserSchema);
