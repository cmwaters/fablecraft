import mongoose from "mongoose";
import { User } from "./user";

export interface DocumentHeader extends mongoose.Document {
	title: string;
	owner: User;
	cards: number

	authors: User[];
	editors: User[];
	viewers: User[];
}

const DocumentSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	cards: {
		type: Number,
		required: true,
	},
	authors: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	],
	editors: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	],
	viewers: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	],
});

export const DocumentModel = mongoose.model<DocumentHeader>("DocumentHeader", DocumentSchema);
