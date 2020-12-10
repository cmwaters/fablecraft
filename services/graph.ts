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

	async addPermission(userID: string, new_permission: PermissionGroup): Promise<Error | null> {
		let user = await UserModel.findById(userID, (err: any) => {
			return new Error(err)
		})
		if (!user) { // check the user exists
			return new Error("user not found")
		}
		let current_permission = this.story.getPermission(user)
		if (current_permission === PermissionGroup.Owner) {
			// no one can change the permission of the owner. Not even the owner themselves. In order to
			// change ownership the owner must nominate a user to be owner.
			return new Error(storyErrors.UserPermissionDenied)
		}
		switch (new_permission) {
			case PermissionGroup.None:
				return new Error("cannot assign none permission. Must remove user from permission list instead.")
			case PermissionGroup.Viewer:
				if (this.permission != PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					return new Error(storyErrors.UserPermissionDenied)
				}
				if (current_permission === PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					// someone who is not the owner is trying to demote an author to a viewer
					return new Error(storyErrors.UserPermissionDenied)
				}
				this.removeUserFromPermissionGroup(user, current_permission)
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
				if (current_permission === PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					// someone who is not the owner is trying to demote an author to an editor
					return new Error(storyErrors.UserPermissionDenied)
				}
				this.removeUserFromPermissionGroup(user, current_permission)
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
				this.removeUserFromPermissionGroup(user, current_permission)
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
				// remove from existing permission group if any
				this.removeUserFromPermissionGroup(user, current_permission)
				// make previous owner an author
				if (this.story.authors) {
					this.story.authors.push(this.story.owner)
				} else {
					this.story.authors = [this.story.owner]
				}
				// switch out owner for new owner
				this.story.owner = user
				break;
		}

		this.story.save().catch((err: any) => {
			return new Error(err)
		})

		return null
	}

	private removeUserFromPermissionGroup(user: User, permission: PermissionGroup): void {
		switch (permission) {
			case PermissionGroup.Viewer:
				this.removeUserFromArray(this.story.viewers!, user)
				break;
			case PermissionGroup.Editor:
				this.removeUserFromArray(this.story.editors!, user)
				break;
			case PermissionGroup.Author:
				this.removeUserFromArray(this.story.authors!, user)
				break;
			// if owner or none then ignore
		}
	}

	private removeUserFromArray(array: User[], user: User): void {
		let index = array.indexOf(user)
		array.splice(index, 1)
		return
	}

	async removePermission(userID: string, requestingUser: User): Promise<Error | null> {
		let user = await UserModel.findById(userID, (err: any) => {
			return new Error(err)
		})
		if (!user) { // check the user exists
			return new Error("user not found")
		}
		let current_permission = this.story.getPermission(user)
		if (current_permission === PermissionGroup.Owner) {
			console.log("1")
			// no one can delete the permission of the owner. Not even the owner themselves. In order to
			// remove ownership the owner must nominate a user to be owner.
			return new Error(storyErrors.UserPermissionDenied)
		}
		// you should always be able to remove yourself
		if (requestingUser.id == userID) {
			console.log("2")
			this.removeUserFromPermissionGroup(user, current_permission)
			this.story.save().catch((err: any) => {
				return new Error(err)
			})
			return null
		}

		// only the owner can remove authors
		if (current_permission === PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
			console.log("3")
			return new Error(storyErrors.UserPermissionDenied)
		}
		// viewers and editors can't remove anyone
		if (this.permission === PermissionGroup.Editor || this.permission === PermissionGroup.Viewer) {
			console.log("4")
			return new Error(storyErrors.UserPermissionDenied)
		}

		console.log("5")
		this.removeUserFromPermissionGroup(user, current_permission)
		this.story.save().catch((err: any) => {
			return new Error(err)
		})

		return null
	}
}

