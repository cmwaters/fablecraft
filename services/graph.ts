import { Story, StoryModel } from "./../models/story";
import { Card, CardModel } from "./../models/card";
import { User } from "./../models/user";
import { MessageSet, MessageI, PermissionGroup } from "../messages/messages";

export type GraphError = {
	reason: string;
};

// perhaps this could just be tacked on to the user interface
export namespace StoryGraph {
	// EXPORTED FUNCTIONS

	export function serializeGraph(
		story: Story
	): { cards: Card[]; err: GraphError | null } {
		return { cards: [], err: null };
	}

	export function createStory(
		user: User,
		title: string,
		description?: string
	): GraphError | null {
		if (title === undefined || title === "") {
			return { reason: "empty title" };
		}

		let story = new StoryModel({
			title: title,
			owner: user._id,
		});

		let card = new CardModel({
			text: "",
			story: story,
			depth: 0,
			index: 0,
		});

		story.rootCard = card;
		if (description !== undefined || description !== "") {
			story.description = description;
		}

		story.save((err: any, story: Story) => {
			if (err) {
				return { reason: "unable to save story because: " + err };
			}
		});

		card.save((err: any, card: Card) => {
			if (err) {
				return { reason: "unable to save root card of story because: " + err };
			}
		});

		return null
	}

	export async function deleteStory(
		user: User,
		storyId: string
	): Promise<GraphError | null> {
		await StoryModel.findById(storyId, (err, story: Story) => {
			if (err) {
				return { reason: "unable to find story because: " + err };
			} else if (story === null) {
				return { reason: "story with id: " + storyId + " does not exist" };
			} else if (story.owner !== user._id) {
				return { reason: "you don't have permissions to delete this story" };
			} else {
				StoryModel.deleteOne(story, (err) => {
					if (err) {
						return {
							reason:
								"unable to delete story with id " +
								storyId +
								" because: " +
								err,
						};
					}
					return null;
				});
			}
		});
		return null;
	}

	export async function editStory(
		user: User,
		storyId: string,
		messages: MessageI[]
	): Promise<GraphError | null> {
		await StoryModel.findById(storyId, (dbErr: any, story: Story) => {
			if (dbErr) {
				return {
					reason:
						"error: story of id " +
						storyId +
						" can not be found, err: " +
						dbErr,
				};
			}
			let perm = getPermission("viewer", user, story);
			if (perm == PermissionGroup.None) {
				return { reason: "error: user has no permissions for this story" };
			}
			let err = StoryGraph.processMessages({
				userPerm: perm,
				story: story,
				messages: messages,
			});
			if (err) {
				return err;
			}
			return null;
		});
		return null;
	}

	export async function findStory(
		user: User,
		storyId: string
	): Promise<{ story: Story | null; err: GraphError | null }> {
		await StoryModel.findById(storyId, (err: any, story: Story) => {
			if (err) {
				return {
					story: null,
					err: { reason: "failed to find story because: " + err },
				};
			}
			if (story === null) {
				return { story: null, err: { reason: "story does not exist" } };
			}
			if (getPermission("viewer", user, story) == PermissionGroup.None) {
				return { story: null, err: { reason: "story does not exist" } };
			}
			return { story: story, err: null };
		});
		return { story: null, err: { reason: "why are we here" } };
	}

	export function processMessages(msgs: MessageSet): GraphError | null {
		if (msgs === undefined || msgs.messages.length === 0) {
			return { reason: "empty message set" };
		}

		// first check that the user has permission to complete all the operations provided
		for (let index = 0; index < msgs.messages.length; index++) {
			let msg = msgs.messages[index];
			if (!msg.hasPermission(msgs.userPerm)) {
				return {
					reason:
						"user does not have permission for " +
						msg.constructor.name +
						" at pos " +
						index,
				};
			}
		}

		// now run these updates to story
		for (let index = 0; index < msgs.messages.length; index++) {
			let msg = msgs.messages[index];
			let err = msg.update(msgs.story);
			if (err) {
				return {
					reason:
						"unable to execute all messages. Failed at " +
						msg.constructor.name +
						" at pos " +
						index +
						" because: " +
						err,
				};
			}
		}

		return null;
	}

	export function getPermission(
		permissionLevel: string,
		user: User,
		story: Story
	): PermissionGroup {
		// cascade through each of the permission groups
		switch (permissionLevel) {
			case "viewer":
				if (story.viewers !== undefined) {
					for (let i = 0; i < story.viewers.length; i++) {
						if (story.viewers[i]._id == user.id) {
							return PermissionGroup.Viewer;
						}
					}
				}
			case "editor":
				if (story.editors !== undefined) {
					for (let i = 0; i < story.editors.length; i++) {
						if (story.editors[i]._id == user._id) {
							return PermissionGroup.Editor;
						}
					}
				}
			case "author":
				if (story.authors !== undefined) {
					for (let i = 0; i < story.authors.length; i++) {
						if (story.authors[i]._id == user._id) {
							return PermissionGroup.Author;
						}
					}
				}
			case "owner":
				if (story.owner._id == user._id) {
					return PermissionGroup.Owner;
				}
			default:
				return PermissionGroup.None;
		}
	}
}



// export function userStories(user: User): Promise<{stories: Story[] | null, err: GraphError | null}> {
//   if (user.stories === undefined) {
//     return { stories: null, err: null};
//   }
  
//   for (story of user.stories)
// }
