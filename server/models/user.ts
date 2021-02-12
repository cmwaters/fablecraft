import mongoose from "mongoose";
import { DocumentHeader } from "./header";

export interface User extends mongoose.Document, Express.User {
    username: string;
    password: string;
    email: string;
    name: string;
    documents: DocumentHeader[];
    lastDocument: any;
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
    documents: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "DocumentHeader",
        },
    ],
    // this is the last story that the user interacted with. It is
    // used when the user starts a new session.
    lastDocument: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DocumentHeader",
    },
});

export const UserModel = mongoose.model<User>("User", UserSchema);
