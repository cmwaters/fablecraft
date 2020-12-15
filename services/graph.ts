import { Story, StoryModel } from "./../models/story";
import { Card, CardModel } from "./../models/card";
import { User, UserModel } from "./../models/user";
import { PermissionGroup } from "../services/permissions";
import { errors } from "../routes/errors";
import { HTTP, status } from "../routes/status";

export class Graph {
	status: number
	response: any

	story?: Story
	card?: Card
	permission?: PermissionGroup
	

	static async loadFromStory(user: User, storyID: string): Promise<Graph> {
		let story = await StoryModel.findById(storyID, (err) => {
			if (err) {
				return new Graph(status.INTERNAL, err)
			}
		})

		if (!story) {
			return new Graph(status.ERROR, errors.StoryNotFound)
		}
		
		const userPerm = story.getPermission(user)
		if (userPerm === PermissionGroup.None) {
			return new Graph(status.UNAUTHORIZED, errors.UserPermissionDenied)
		}
		return new Graph(status.READ, story, story, userPerm)
	}

	static async loadFromCard(user: User, cardID: string): Promise<Graph> {
		let card = await CardModel.findById(cardID, (err) => {
			if (err) { return new Graph(status.INTERNAL, err)}
		})

		if (!card) {
			return new Graph(status.ERROR, errors.CardNotFound)
		}

		
		let graph = await Graph.loadFromStory(user, card.story._id)

		graph.card = card
		return graph
	}

	constructor(status: number, response: any, story?: Story, permission?: PermissionGroup) {
		if (story) { 
			this.story = story;
		}
		if (permission) {
			this.permission = permission
		}
		this.status = status
		this.response = response
	}

	static async create(
		user: User,
		title: string,
		description?: string
	): Promise<Graph> {
		if (title === undefined || title === "") {
			return new Graph(status.BADREQUEST, errors.MissingTitle)
		}

		try {

			let story = new StoryModel({
				title: title,
				owner: user._id,
			});

			if (description !== undefined || description !== "") {
				story.description = description;
			}

			await story.save()
			
			// we always must have at least one card associated with
			// a story
			let rootCard = new CardModel({ 
				story: story.id,
				depth: 0,
				index: 0,
				text: " ", // needs to be something
			})
			await rootCard.save()

			// add story to user
			const stories = user.stories.concat(story);
			await UserModel.findByIdAndUpdate(user._id, {stories: stories}).catch((err: any) => {
				throw err
			})

			return new Graph(status.CREATED, { story: story, rootCard: rootCard }, story, PermissionGroup.Owner)
		} catch (error) {
			return new Graph(status.INTERNAL, error)
		}
	}

	hasAnError(): boolean {
		switch(this.status) {
			case status.ERROR:
			case status.INTERNAL:
			case status.UNAUTHORIZED: 
			case status.NOTFOUND:
			case status.BADREQUEST:
				return true
		}
		// this shouldn't happen
		if (this.story === undefined) {
			this.status = status.INTERNAL
			console.log("an empty story was returned without the adequate status")
			return true
		}
		return false
	}

	send(res: any): void {
		switch(this.status) {
			case status.INTERNAL:
				console.log("internal error: " + this.response)
				this.response = null
				break;
			case status.ERROR:
			case status.BADREQUEST:
				this.response = { error: this.response }
				break;
		}
		res.status(HTTP[this.status]).send(this.response)
		return
	}

	async remove(): Promise<void> {
		if (this.hasAnError()) { return }
		await StoryModel.deleteOne(this.story!).catch((err: any) => {
			if (err) {
				return this.internal(err)
			}
		})
		this.status = status.DELETED
	}

	async modify(newTitle: string, newDescription: string): Promise<void> {
		if (this.hasAnError()) { return }
		if ((newTitle === undefined || newTitle === "") && (newDescription === undefined || newDescription === "")) {
			this.status = status.BADREQUEST
			this.response = errors.InvalidArguments
			return
		}
		if (this.permission == PermissionGroup.Viewer || this.permission == PermissionGroup.Editor) {
			return this.error(errors.UserPermissionDenied)
		}
		if (newTitle) {
			this.story!.title = newTitle
		}
		if (newDescription) { 
			this.story!.description = newDescription
		}
		await this.story!.save().catch((err: any) => {
			if (err) {
				return this.internal(err)
			}
		})
		this.status = status.UPDATED
	}

	async addPermission(userID: string, new_permission: PermissionGroup): Promise<void> {
		if (this.hasAnError()) { return }
		let user = await UserModel.findById(userID, (err: any) => {
			if (err) {
				return this.internal(err)
			}
		})
		if (!user) { // check the user exists
			this.status = status.ERROR
			this.response = errors.UserNotFound
			return
		}
		let current_permission = this.story!.getPermission(user)
		if (current_permission === PermissionGroup.Owner) {
			// no one can change the permission of the owner. Not even the owner themselves. In order to
			// change ownership the owner must nominate a user to be owner.
			return this.error(errors.UserPermissionDenied)
		}
		switch (new_permission) {
			case PermissionGroup.None:
				return this.error("cannot assign none permission. Must remove user from permission list instead.")
			case PermissionGroup.Viewer:
				if (this.permission != PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					return this.error(errors.UserPermissionDenied)
				}
				if (current_permission === PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					// someone who is not the owner is trying to demote an author to a viewer
					return this.error(errors.UserPermissionDenied)
				}
				this.removeUserFromPermissionGroup(user, current_permission)
				if (this.story!.viewers) {
					this.story!.viewers.push(user)
				} else {
					this.story!.viewers = [user]
				}
				break;
			case PermissionGroup.Editor:
				if (this.permission != PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					return this.error(errors.UserPermissionDenied)
				}
				if (current_permission === PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
					// someone who is not the owner is trying to demote an author to an editor
					return this.error(errors.UserPermissionDenied)
				}
				this.removeUserFromPermissionGroup(user, current_permission)
				if (this.story!.editors) {
					this.story!.editors.push(user)
				} else {
					this.story!.editors = [user]
				}
				break;
			case PermissionGroup.Author:
				// only owners can add authors
				if (this.permission != PermissionGroup.Owner) {
					return this.error(errors.UserPermissionDenied)
				}
				this.removeUserFromPermissionGroup(user, current_permission)
				if (this.story!.authors) {
					this.story!.authors.push(user)
				} else {
					this.story!.authors = [user]
				}
				break;
			case PermissionGroup.Owner: // changing of ownership
				if (this.permission != PermissionGroup.Owner) {
					return this.error(errors.UserPermissionDenied)
				}
				// remove from existing permission group if any
				this.removeUserFromPermissionGroup(user, current_permission)
				// make previous owner an author
				if (this.story!.authors) {
					this.story!.authors.push(this.story!.owner)
				} else {
					this.story!.authors = [this.story!.owner]
				}
				// switch out owner for new owner
				this.story!.owner = user
				break;
		}

		this.story!.save().catch((err: any) => {
			if (err) {
				return this.internal(err)
			}
		})

		if (current_permission == PermissionGroup.None) {
			this.status = status.CREATED
		} else {
			this.status = status.UPDATED
		}
		return
	}

	async removePermission(userID: string, requestingUser: User): Promise<void> {
		if (this.hasAnError()) { return }
		let user = await UserModel.findById(userID, (err: any) => {
			return new Error(err)
		})
		if (!user) { // check the user exists
			return this.error(errors.UserPermissionDenied)
		}
		let current_permission = this.story!.getPermission(user)
		if (current_permission === PermissionGroup.Owner) {
			// no one can delete the permission of the owner. Not even the owner themselves. In order to
			// remove ownership the owner must nominate a user to be owner.
			return this.error(errors.UserPermissionDenied)
		}
		// you should always be able to remove yourself
		if (requestingUser.id == userID) {
			this.removeUserFromPermissionGroup(user, current_permission)
			this.story!.save().catch((err: any) => {
				if (err) {
					return this.internal(err)
				}
			})
			this.status = status.DELETED
			return
		}

		// only the owner can remove authors
		if (current_permission === PermissionGroup.Author && this.permission != PermissionGroup.Owner) {
			return this.error(errors.UserPermissionDenied)
		}
		// viewers and editors can't remove anyone
		if (this.permission === PermissionGroup.Editor || this.permission === PermissionGroup.Viewer) {
			return this.error(errors.UserPermissionDenied)
		}

		this.removeUserFromPermissionGroup(user, current_permission)
		await this.story!.save((err: any) => {
			if (err) {
				return this.internal(err)
			}
		})
		
		this.status = status.DELETED
		return
	}

	async cards(): Promise<void> {
		if (this.hasAnError()) { return }
		await CardModel.find({story: this.story}, (err, cards) => {
			if (err) { return this.internal(err) }
			if (cards) {
				this.status = status.READ
				this.response = { cards: cards } 
			}
		})
		
	}

	async addCardAbove(siblingID: any, text: string): Promise<void> {
		if (this.hasAnError()) { return }

		if (this.permission != PermissionGroup.Owner && this.permission != PermissionGroup.Author) {
			return this.error(errors.UserPermissionDenied)
		}

		try {
		
			// fetch sibling card and check that it exists
			let sibling = await CardModel.findById(siblingID)

			if (!sibling) {
				return this.error(errors.CardNotFound)
			}

			// create new card
			let card = await CardModel.create({ 
				story: this.story!.id,
				depth: sibling.depth,
				// this field is eventually consistent
				index: sibling.index, 
				below: sibling.id,
				text: text
			})

			// update the parent
			if (sibling.parent) {
				card.parent = sibling.parent
				await CardModel.findByIdAndUpdate(card.parent, { $addToSet: { children: card.id }})
			}

			// update the sibling above the new one
			if (sibling.above) {
				card.above = sibling.above
				await CardModel.findByIdAndUpdate(card.above, { below: card.id })
			}

			// // update the sibling
			sibling.above = card.id
			sibling.index = card.index + 1
			await sibling.save()

			// finally save the new card
			await card.save()

			this.status = status.CREATED
			this.response = { card: card }
		} catch (error) { return this.internal(error) }
	}

	async addCardBelow(siblingID: any, text: string): Promise<void> {
		if (this.hasAnError()) { return }

		if (this.permission != PermissionGroup.Owner && this.permission != PermissionGroup.Author) {
			return this.error(errors.UserPermissionDenied)
		}

		try { 
			
			// fetch sibling card and check that it exists
			let sibling = await CardModel.findById(siblingID)

			if (!sibling) {
				return this.error(errors.CardNotFound)
			}

			// create new card
			let card = await CardModel.create({ 
				story: this.story!.id,
				depth: sibling.depth,
				// this field is eventually consistent
				index: sibling.index + 1, 
				above: sibling.id,
				text: text
			})

			// update the parent
			if (sibling.parent) {
				card.parent = sibling.parent
				await CardModel.findByIdAndUpdate(card.parent, { $addToSet: { children: card.id }})
			}

			// update the sibling below the new one
			if (sibling.below) {
				card.below = sibling.below
				await CardModel.findByIdAndUpdate(card.below, { index: card.index + 1, above: card.id })
			}

			// // update the sibling
			sibling.below = card.id
			await sibling.save()

			// finally save the new card
			await card.save()

			this.status = status.CREATED
			this.response = { card: card }
		
		} catch(err) { 
			console.error(err)
			return this.internal(err)
		}

		return
	}

	async addCardChild(parent: any, text: string): Promise<void> {
		return
	}

	async addCardParent(child: any, text: string): Promise<void> {
		return
	}

	async removeCard(): Promise<void> {
		if (this.hasAnError()) { return }
		this.deleteCard(this.card!)
	}

	private async deleteCard(card: Card): Promise<void> {
		if (this.hasAnError()) { return }
		if (this.card!.children) {
			for (let child of this.card!.children) {
				this.deleteCard(child)
			}
		}
		await CardModel.findByIdAndDelete(card.id, (err) => {
			return this.internal(err)
		})
		return
	}

	private error(err: any) {
		if (err == errors.UserPermissionDenied) {
			this.status = status.UNAUTHORIZED
			this.response = err
		} else {
			this.status = status.ERROR
			this.response = err
		}
	}

	private internal(err: any) {
		this.status = status.INTERNAL
		this.response = new Error(err)
	}

	private removeUserFromPermissionGroup(user: User, permission: PermissionGroup): void {
		switch (permission) {
			case PermissionGroup.Viewer:
				this.removeUserFromArray(this.story!.viewers!, user)
				break;
			case PermissionGroup.Editor:
				this.removeUserFromArray(this.story!.editors!, user)
				break;
			case PermissionGroup.Author:
				this.removeUserFromArray(this.story!.authors!, user)
				break;
			// if owner or none then ignore
		}
	}

	private removeUserFromArray(array: User[], user: User): void {
		let index = array.indexOf(user)
		array.splice(index, 1)
		return
	}
}

