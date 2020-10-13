import mongoose from "mongoose";
import { Story } from './story'

export interface Card extends mongoose.Document {
	text: string;
	story: Story;
	depth: number;
	index: number;
	parent?: Card;
	children?: Card[]; // unordered list of children
	above?: Card;
	below?: Card;
}

export const CardSchema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
	},
	story: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Story",
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
	parent: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Card",
	},
	children: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Card",
		},
	],
	above: {
		// siblings
		type: mongoose.Schema.Types.ObjectId,
		ref: "Card",
	},
	below: {
		// siblings
		type: mongoose.Schema.Types.ObjectId,
		ref: "Card",
	},
});

CardSchema.index({ story: 1, depth: 1, index: 1 });
export const CardModel = mongoose.model<Card>("Card", CardSchema);
