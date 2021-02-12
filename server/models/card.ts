import mongoose from "mongoose";
import { DocumentHeader } from './header'

export interface Card extends mongoose.Document {
	_id: any
	text: string;
	document: DocumentHeader;
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
	document: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "DocumentHeader",
		required: true,
	},
	// each card in a document has a unique monotonically increasing index
	index: {
		type: Number,
		required: true,
	},
	// the pillar that the card resides in
	depth: {
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
	// it is arguable that having both above and below is unnecessary and perhaps
	// just having a reference to the above card is all that is needed. 
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
	remoed: {
		type: Boolean,
	}
});

CardSchema.index({ document: 1, index: 1 });

export const CardModel = mongoose.model<Card>("Card", CardSchema);
