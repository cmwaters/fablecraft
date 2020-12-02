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

	// async edit(
	// 	user: User,
	// 	storyId: string,
	// 	messages: MessageI[]
	// ): Promise<GraphError | null> {
	// 	await StoryModel.findById(storyId, (dbErr: any, story: Story) => {
	// 		if (dbErr) {
	// 			return {
	// 				reason:
	// 					"error: story of id " +
	// 					storyId +
	// 					" can not be found, err: " +
	// 					dbErr,
	// 			};
	// 		}
	// 		let perm = getPermission("viewer", user, story);
	// 		if (perm == PermissionGroup.None) {
	// 			return { reason: "error: user has no permissions for this story" };
	// 		}
	// 		let err = StoryCraft.processMessages({
	// 			userPerm: perm,
	// 			story: story,
	// 			messages: messages,
	// 		});
	// 		if (err) {
	// 			return err;
	// 		}
	// 		return null;
	// 	});
	// 	return null;
	// }

	// async find(
	// 	user: User,
	// 	storyId: string
	// ): Promise<{ story: Story | null; err: GraphError | null }> {
	// 	await StoryModel.findById(storyId, (err: any, story: Story) => {
	// 		if (err) {
	// 			return {
	// 				story: null,
	// 				err: { reason: "failed to find story because: " + err },
	// 			};
	// 		}
	// 		if (story === null) {
	// 			return { story: null, err: { reason: "story does not exist" } };
	// 		}
	// 		if (getPermission("viewer", user, story) == PermissionGroup.None) {
	// 			return { story: null, err: { reason: "story does not exist" } };
	// 		}
	// 		return { story: story, err: null };
	// 	});
	// 	return { story: null, err: { reason: "why are we here" } };
	// }

	// processMessages(msgs: MessageSet): GraphError | null {
	// 	if (msgs === undefined || msgs.messages.length === 0) {
	// 		return { reason: "empty message set" };
	// 	}

	// 	// first check that the user has permission to complete all the operations provided
	// 	for (let index = 0; index < msgs.messages.length; index++) {
	// 		let msg = msgs.messages[index];
	// 		if (!msg.hasPermission(msgs.userPerm)) {
	// 			return {
	// 				reason:
	// 					"user does not have permission for " +
	// 					msg.constructor.name +
	// 					" at pos " +
	// 					index,
	// 			};
	// 		}
	// 	}

	// 	// now run these updates to story
	// 	for (let index = 0; index < msgs.messages.length; index++) {
	// 		let msg = msgs.messages[index];
	// 		let err = msg.update(msgs.story);
	// 		if (err) {
	// 			return {
	// 				reason:
	// 					"unable to execute all messages. Failed at " +
	// 					msg.constructor.name +
	// 					" at pos " +
	// 					index +
	// 					" because: " +
	// 					err,
	// 			};
	// 		}
	// 	}

	// 	return null;
	// }
}

