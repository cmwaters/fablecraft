import mongoose from "mongoose";
import { Card, CardSchema } from "./card";
import { User } from "./user";
export interface Story extends mongoose.Document {
	title: string;
	owner: User;

	description?: string;
	rootCard?: Card;
	authors?: User[];
	editors?: User[];
	viewers?: User[];
}

const StorySchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	description: String,
	rootCard: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
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

export const StoryModel = mongoose.model<Story>("Story", StorySchema);
