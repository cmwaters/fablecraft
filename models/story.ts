import { PermissionGroup } from "../services/permissions";
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

	getPermission(user: User): PermissionGroup
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

StorySchema.methods.getPermission = function(user: User): PermissionGroup {
	if (user.id == this.owner) {
		return PermissionGroup.Owner
	}
	for (let author of this.authors) {
		if (user.id == author) {
			return PermissionGroup.Author
		}
	}
	for (let editor of this.editors) {
		if (user.id == editor) {
			return PermissionGroup.Editor
		}
	}
	for (let viewer of this.viewers) {
		if (user.id == viewer) {
			return PermissionGroup.Viewer
		}
	}
	return PermissionGroup.None
}

export const StoryModel = mongoose.model<Story>("Story", StorySchema);
