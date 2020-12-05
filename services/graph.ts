import { Story, StoryModel } from "./../models/story";
import { Card, CardModel } from "./../models/card";
import { User, UserModel } from "./../models/user";
import { MessageSet, MessageI, PermissionGroup } from "../messages/messages";
import { storyErrors } from "../routes/errors";

const err = storyErrors

export class Graph {
	story: Story
	permission: PermissionGroup

	static async loadFromUser(user: User, storyId: string): Promise<Graph> {
		const story = await StoryModel.findById(storyId, (err) => {
			if (err) {
				return Promise.reject(err)
			}
		})
		if (!story) {
			return Promise.reject(err.StoryNotFound)
		}
		const userPerm = story.getPermission(user)
		if (userPerm === PermissionGroup.None) {
			return Promise.reject(err.UserPermissionDenied)
		}
		return Promise.resolve(new Graph(story, userPerm))
	}

	constructor(story: Story, permission: PermissionGroup) {
		this.story = story;
		this.permission = permission
	}

	static async create(
		user: User,
		title: string,
		description?: string
	): Promise<Story> {
		if (title === undefined || title === "") {
			return Promise.reject("empty title");
		}

		let story = new StoryModel({
			title: title,
			owner: user._id,
		});

		let card = new CardModel({
			text: story._id,
			story: story,
			depth: 0,
			index: 0,
		});

		story.rootCard = card;
		if (description !== undefined || description !== "") {
			story.description = description;
		}

		await card.save().catch((err: any) => {
			return Promise.reject("unable to save root card of story because: " + err);
		});

		await story.save().catch((err: any) => {
			return Promise.reject("unable to save story because: " + err);
		})		

		// add story to user
		const stories = user.stories.concat(story);
		await UserModel.findByIdAndUpdate(user._id, {stories: stories}).catch((err: any) => {
			return Promise.reject("unable to update user with new story because " + err)
		})

		return Promise.resolve(story)
	}

	async remove(): Promise<boolean> {
		await StoryModel.deleteOne(this.story).catch((err: any) => {
			return Promise.reject(err)
		})
		return Promise.resolve(true);
	}

	async changeTitle(newTitle: string): Promise<any> {
		if (newTitle === undefined || newTitle === "") {
			return Promise.reject("invalid title")
		}
		this.story.title = newTitle
		await this.story.save().catch((err: any) => {
			return Promise.reject(err)
		})
		return Promise.resolve()
	}

	async addPermission(userID: string, permission: PermissionGroup): Promise<Error | null> {
		let user = await UserModel.findById(userID, (err: any) => {
			return new Error(err)
		})
		if (!user) { // check the user exists
			return new Error("user not found")
		}
		switch (permission) {
			case PermissionGroup.None:
				return new Error("cannot assign none permission. Must remove user from permission list instead.")
			case PermissionGroup.Viewer:
				if (this.permission != PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					return new Error(storyErrors.UserPermissionDenied)
				}
				if (this.story.viewers) {
					this.story.viewers.push(user)
				} else {
					this.story.viewers = [user]
				}
				break;
			case PermissionGroup.Editor:
				if (this.permission != PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					return new Error(storyErrors.UserPermissionDenied)
				}
				if (this.story.editors) {
					this.story.editors.push(user)
				} else {
					this.story.editors = [user]
				}
				break;
			case PermissionGroup.Author:
				if (this.permission != PermissionGroup.Owner) {
					return new Error(storyErrors.UserPermissionDenied)
				}
				if (this.story.authors) {
					this.story.authors.push(user)
				} else {
					this.story.authors = [user]
				}
				break;
			case PermissionGroup.Owner: // changing of ownershiip
				if (this.permission != PermissionGroup.Owner) {
					return new Error(storyErrors.UserPermissionDenied)
				}
				this.story.owner = user
				break;
		}

		this.story.save().catch((err: any) => {
			return new Error(err)
		})

		return null
	}

	async removePermission(userID: string, permission: PermissionGroup): Promise<Error | null> {

	

		return null
	}
}

