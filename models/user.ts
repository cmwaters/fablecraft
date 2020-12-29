import mongoose from "mongoose";
import { Story } from "./story";

export interface User extends mongoose.Document {
    username: string;
    password: string;
    email: string;
    name: string;
    stories: Story[];
    lastStory: any;

    withoutPassword(): any;
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
        lowercase: true,
        required: true,
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

UserSchema.methods.withoutPassword = function(): any {
    return {
        username: this.username,
        email: this.email,
        name: this.name, 
        stories: this.stories,
        lastStory: this.lastStory,
    }
}

export const UserModel = mongoose.model<User>("User", UserSchema);
