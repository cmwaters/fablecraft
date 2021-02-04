import { DocumentHeader, DocumentModel } from '../models/header'
import { PermissionGroup } from './permissions'
import mongoose from 'mongoose';
import { Card, CardModel } from '../models/card'
import { User, UserModel } from '../models/user'
import { errors } from './errors'

export class Document {
    header: DocumentHeader
    cards: Card[] = []

    constructor(header: DocumentHeader, cards: Card[] = []) {
        this.header = header
        this.cards = cards
    }

    static async create(owner: User, title: string): Promise<Document> {
        if (title === undefined || title === "") {
            throw new Error(errors.MissingTitle);
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        try {

            let documents = await DocumentModel.create([{
                title: title,
                owner: owner._id,
                indexCounter: 0,
            }], { session: session });
            let document = documents[0]

            // we always must have at least one card associated with
            // a story
            let rootCard = await CardModel.create([{
                document: document.id,
                depth: 0,
                index: 1,
                text: " ", // needs to be something
            }], { session: session });

            // add story to user and make it the users last story
            owner.documents.push(document)
            owner.lastDocument = document

            await owner.save({session: session})

            await session.commitTransaction()

            return new Document(document, rootCard);
        } catch (error) {
            await session.abortTransaction()
            throw new Error(error)
        }
    }

    static async load(user: User, id: string, permission: PermissionGroup = PermissionGroup.Viewer): Promise<Document> {
        let header = await DocumentModel.findById(id, null, null, (err) => {
            if (err) {
                throw err
            }
        });

        if (!header) {
            throw new Error(errors.DocumentNotFound);
        }

        let document = new Document(header)

        // get permissions from the user and store them in the graph
        const userPerm = document.getPermission(user)
        if (userPerm < permission) {
            throw new Error(errors.UserPermissionDenied);
        }

        // update the last story if the user is now working on a different story
        if (user.lastDocument !== header._id) {
            user.lastDocument = header._id;
            await user.save()
        }

        return document
    }

    static async delete(user: User, id: string) {
        let header = await DocumentModel.findById(id)
        if (!header) {
            throw new Error(errors.DocumentNotFound)
        }
        let document = new Document(header)

        if (document.getPermission(user) !== PermissionGroup.Owner) {
            throw new Error(errors.UserPermissionDenied)
        }

        // create a session to delete the header and the cards in
        // a single transaction
        const session = await mongoose.startSession()
        session.startTransaction()

        try {

            await CardModel.deleteMany({ document: header.id })

            await header.delete()

            await session.commitTransaction()

        } catch (error) {
            session.abortTransaction()
            throw error
        }
    }

    async modifyTitle(newTitle: string): Promise<DocumentHeader> {
        if (newTitle === null || newTitle === undefined) {
            throw new Error(errors.MissingTitle)
        }
        this.header.title = newTitle
        return await this.header.save()
    }

    async loadCards() {
        this.cards = await CardModel.find({ document: this.header._id })
    }

    async addCardAbove(user: User, siblingCardId: string, text: string): Promise<Card> {
        let permission = this.getPermission(user)
        if (permission != PermissionGroup.Owner && permission != PermissionGroup.Author) {
            throw new Error(errors.UserPermissionDenied);
        }

        // there are as many as five changes taking place. We need to ensure that they
        // occur as a single transaction else fail
        const session = await mongoose.startSession()
        session.startTransaction()

        // fetch sibling card and check that it exists
        let sibling = await CardModel.findById(siblingCardId, { session: session });
        if (!sibling) {
            await session.abortTransaction()
            throw new Error(errors.CardNotFound);
        }

        try {
            // create new card
            let cards = await CardModel.create([{
                document: this.header.id,
                depth: sibling.depth,
                index: this.cardIndex(session),
                below: sibling.id,
                above: sibling.above,
                parent: sibling.parent,
                text: text,
            }], { session: session });
            let card = cards[0]

            // update the parent
            if (sibling.parent) {
                await CardModel.findByIdAndUpdate(card.parent, { $addToSet: { children: card.id } }, { session: session });
            }

            // update the sibling above the new one
            if (sibling.above) {
                await CardModel.findByIdAndUpdate(card.above, { below: card.id }, { session: session });
            }

            // update the sibling
            sibling.above = card.id;
            await sibling.save();

            // commit all changes as a single transaction and return the new card
            await session.commitTransaction()
            return card

        } catch (err) {
            await session.abortTransaction()
            throw err
        }
    }

    async addCardBelow(user: User, siblingCardId: string, text: string) {
        let permission = this.getPermission(user)
        if (permission < PermissionGroup.Author) {
            throw new Error(errors.UserPermissionDenied);
        }

        // there are as many as five changes taking place. We need to ensure that they
        // occur as a single transaction else fail
        const session = await mongoose.startSession()
        session.startTransaction()

        // fetch sibling card and check that it exists
        let sibling = await CardModel.findById(siblingCardId, { session: session });
        if (!sibling) {
            await session.abortTransaction()
            throw new Error(errors.CardNotFound);
        }

        try {            
            // create new card
            let cards = await CardModel.create([{
                document: this.header.id,
                depth: sibling.depth,
                index: this.cardIndex(session),
                above: sibling.id,
                text: text,
                parent: sibling.parent,
                below: sibling.below,
            }], {session: session});
            let card = cards[0]

            // update the parent
            if (sibling.parent) {
                await CardModel.findByIdAndUpdate(card.parent, { $addToSet: { children: card.id } }, { session: session });
            }

            // update the sibling below the new one
            if (sibling.below) {
                await CardModel.findByIdAndUpdate(card.below, { above: card.id }, {session: session});
            }

            // update the sibling
            sibling.below = card.id;
            await sibling.save();

            // commit all changes as a single transaction and return the new card
            await session.commitTransaction()
            return card

        } catch (err) {
            session.abortTransaction()
            throw err
        }
    }

    async addChildCard(user: User, parentCardId: string, text: string): Promise<Card> {
        let permission = this.getPermission(user)
        if (permission < PermissionGroup.Author) {
            throw new Error(errors.UserPermissionDenied);
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        // fetch parent card and check that it exists
        let parent = await CardModel.findById(parentCardId);
        if (!parent) {
            session.abortTransaction()
            throw new Error(errors.CardNotFound);
        }

        try {
            // if the parent already has children then we append this new card to the end
            if (parent.children && parent.children.length > 0) {
                let lastChildIdx = parent.children![parent.children!.length - 1];
                let lastChild = await CardModel.findById(lastChildIdx, {session: session});
                if (!lastChild) {
                    throw new Error("data corrupted: unable to find parents child");
                }

                // create new card
                let cards = await CardModel.create([{
                    document: this.header.id,
                    depth: lastChild.depth,
                    index: this.cardIndex(session),
                    parent: parent.id,
                    above: lastChild.id,
                    below: lastChild.below,
                    text: text,
                }], { session: session });
                let card = cards[0]

                // update the card below if it exists
                if (lastChild.below) {
                    await CardModel.findByIdAndUpdate(card.below, { above: card.id })
                }

                // update the last card
                lastChild.below = card.id;
                await lastChild.save();

                parent.children!.push(card)
                parent.save()

                session.commitTransaction()
                return card
            } else {

                // this is the first child of the parent but perhaps there may be existing
                // cards in this column. We should check and find the card that would be directly
                // above and below the parent
                let lastCard = await CardModel.findOne({ depth: parent.depth + 1, below: undefined })

                // this is the first child of the parent
                let cards = await CardModel.create([{
                    document: this.header.id,
                    depth: parent.depth + 1,
                    index: this.cardIndex(session),
                    parent: parent.id,
                    text: text,
                }], { session: session });
                let card = cards[0]                

                parent.children = cards
                await parent.save()

                session.commitTransaction()
                return card
            }
        } catch (err) {
            session.abortTransaction()
            throw err
        }
    }

    async updateCard(user: User, index: number, text: string): Promise<Card> {
        let permission = this.getPermission(user)
        if (permission !== PermissionGroup.Author && permission !== PermissionGroup.Owner) {
            throw new Error(errors.UserPermissionDenied)
        }

        let card = await CardModel.findOneAndUpdate({document: this.header.id, index: index}, {text: text})
        if (!card) {
            throw new Error(errors.CardNotFound)
        }
        return card
    }

    async deleteCard(user: User, index: number) {
        let permission = this.getPermission(user)
        if (permission < PermissionGroup.Author) {
            throw new Error(errors.UserPermissionDenied);
        }

        let card = await CardModel.findOne({ document: this.header.id, index: index })
        if (!card) {
            throw new Error(errors.CardNotFound)
        }
        
        // try perform all deletions as a single transaction
        const session = await mongoose.startSession()

        try {
            await this.deleteChildren(card, session)
            session.commitTransaction()
        } catch (err) {
            console.error(err)
            session.abortTransaction()
        }

    }

    // deleteChildren gets all the children for that card and for each one deletes 
    // them before recursing on their children. 
    private async deleteChildren(parent: Card, session: mongoose.ClientSession) {
        let children = await CardModel.find({parent: parent}, { session: session})
        children.forEach(child => {
            child.remove()
            this.deleteChildren(child, session)
        })
    }

    async addPermission(requester: User, userId: string, newPermission: PermissionGroup) {
        let requestersPermission = this.getPermission(requester)

        let user = await UserModel.findById(userId)
        // check the user exists
        if (!user) {
            throw new Error(errors.UserNotFound)
        }
        let currentPermission = this.getPermission(user);
        if (currentPermission === PermissionGroup.Owner) {
            // no one can change the permission of the owner. Not even the owner themselves. In order to
            // change ownership the owner must nominate a user to be owner.
            throw new Error(errors.UserPermissionDenied);
        }
        switch (newPermission) {
            case PermissionGroup.None:
                throw new Error("cannot assign none permission. Must remove user from permission list instead.");
            case PermissionGroup.Viewer:
                if (requestersPermission != PermissionGroup.Author && requestersPermission != PermissionGroup.Owner) {
                    throw new Error(errors.UserPermissionDenied);
                }
                if (currentPermission === PermissionGroup.Author && requestersPermission != PermissionGroup.Owner) {
                    // someone who is not the owner is trying to demote an author to a viewer
                    throw new Error(errors.UserPermissionDenied);
                }
                if (this.header.viewers) {
                    this.header.viewers.push(user);
                } else {
                    this.header.viewers = [user];
                }
                break;
            case PermissionGroup.Editor:
                if (requestersPermission != PermissionGroup.Author && requestersPermission != PermissionGroup.Owner) {
                    throw new Error(errors.UserPermissionDenied);
                }
                if (currentPermission === PermissionGroup.Author && requestersPermission != PermissionGroup.Owner) {
                    // someone who is not the owner is trying to demote an author to an editor
                    throw new Error(errors.UserPermissionDenied);
                }
                if (this.header.editors) {
                    this.header.editors.push(user);
                } else {
                    this.header.editors = [user];
                }
                break;
            case PermissionGroup.Author:
                // only owners can add authors
                if (requestersPermission != PermissionGroup.Owner) {
                    throw new Error(errors.UserPermissionDenied);
                }
                if (this.header.authors) {
                    this.header.authors.push(user);
                } else {
                    this.header.authors = [user];
                }
                break;
            case PermissionGroup.Owner: // changing of ownership
                if (requestersPermission != PermissionGroup.Owner) {
                    throw new Error(errors.UserPermissionDenied);
                }
                // make previous owner an author
                if (this.header.authors) {
                    this.header.authors.push(this.header.owner);
                } else {
                    this.header.authors = [this.header.owner];
                }
                // switch out owner for new owner
                this.header.owner = user;
                break;
        }

        // remove from existing permission group if any
        this.removeUserFromPermissionGroup(user, currentPermission);

        await this.header.save()
    }

    async removePermission(requester: User, userId: string) {
        let user = await UserModel.findById(userId)
        if (!user) {
            // check the user exists
            throw new Error(errors.UserPermissionDenied);
        }
        let currentPermission = this.getPermission(user);
        if (currentPermission === PermissionGroup.Owner) {
            // no one can delete the permission of the owner. Not even the owner themselves. In order to
            // remove ownership the owner must nominate a user to be owner.
            throw new Error(errors.UserPermissionDenied);
        }
        // you should always be able to remove yourself
        if (requester.id == userId) {
            this.removeUserFromPermissionGroup(user, currentPermission);
            await this.header.save()
            return;
        }

        // only the owner can remove authors
        let requesterPermission = this.getPermission(requester)
        if (currentPermission === PermissionGroup.Author && requesterPermission != PermissionGroup.Owner) {
            throw new Error(errors.UserPermissionDenied);
        }
        // viewers and editors can't remove anyone
        if (requesterPermission < PermissionGroup.Author) {
            throw new Error(errors.UserPermissionDenied);
        }

        this.removeUserFromPermissionGroup(user, currentPermission);
        await this.header.save()
    }

    getPermission(user: User): PermissionGroup {
        if (user.id == this.header.owner) {
            return PermissionGroup.Owner
        }
        for (let author of this.header.authors) {
            if (user.id == author) {
                return PermissionGroup.Author
            }
        }
        for (let editor of this.header.editors) {
            if (user.id == editor) {
                return PermissionGroup.Editor
            }
        }
        for (let viewer of this.header.viewers) {
            if (user.id == viewer) {
                return PermissionGroup.Viewer
            }
        }
        return PermissionGroup.None
    }

    // moves the card down by one (if it's not the last). This is essentially executed like a swap
    // with the card below swapping with the card above
    async moveCardDown(user: User, cardIndex: number): Promise<void> {
        let permission = this.getPermission(user)
        if (permission < PermissionGroup.Author) {
            throw new Error(errors.UserPermissionDenied);
        }

        let card = await CardModel.findOne({document: this.header.id, index: cardIndex})
        if (!card) {
            throw new Error(errors.CardNotFound)
        }

        if (!card.below) {
            throw new Error(errors.LowerCardBound);
        }

        let lowerCard = await CardModel.findById(card.below);
        if (!lowerCard) {
           throw new Error(errors.DataInconsistency);
        }

        await this.swapCards(card, lowerCard);
    }

    // moves the card up by one (if it's not the last). This is essentially executed like a swap
    // with the card above swapping with the card below
    async moveCardUp(user: User, cardIndex: number): Promise<void> {
        let permission = this.getPermission(user)
        if (permission < PermissionGroup.Author) {
            throw new Error(errors.UserPermissionDenied);
        }

        let card = await CardModel.findOne({document: this.header.id, index: cardIndex})
        if (!card) {
            throw new Error(errors.CardNotFound)
        }
        
        if (card.above) {
            throw new Error(errors.UpperCardBound);
        }


        let upperCard = await CardModel.findById(card.above);
        if (!upperCard) {
            throw new Error(errors.DataInconsistency);
        }

        await this.swapCards(upperCard, card);
    }

    private async swapCards(upperCard: Card, lowerCard: Card): Promise<void> {

        const session = await mongoose.startSession()
        session.startTransaction()

        // swap the outer relationships first
        if (upperCard.above) {
            lowerCard.above = upperCard.above

            // we also need to update the upper neighbor
            await CardModel.findByIdAndUpdate(upperCard.above, { below: lowerCard.id }, { session: session })
        } else {
            lowerCard.above = undefined
        }

        if (lowerCard.below) {
            upperCard.below = lowerCard.below

            // we also need to update the lower neighbor
            await CardModel.findByIdAndUpdate(lowerCard.below, { above: upperCard.id }, { session: session})
        } else {
            upperCard.below = undefined
        }

        // swap the inner relationships
        lowerCard.below = upperCard.id
        upperCard.above = lowerCard.id

        // persist the changes to disk
        await lowerCard.save({ session: session })
        await upperCard.save({ session: session })
    }

    private cardIndex(session: mongoose.ClientSession | null = null): number {
        this.header.cards++
        this.header.save({ session: session})
        return this.header.cards
    }

    private removeUserFromPermissionGroup(user: User, permission: PermissionGroup): void {
        switch (permission) {
            case PermissionGroup.Viewer:
                this.removeUserFromArray(this.header.viewers!, user);
                break;
            case PermissionGroup.Editor:
                this.removeUserFromArray(this.header.editors!, user);
                break;
            case PermissionGroup.Author:
                this.removeUserFromArray(this.header.authors!, user);
                break;
            // if owner or none then ignore
        }
    }

    private removeUserFromArray(array: User[], user: User): void {
        let index = array.indexOf(user);
        array.splice(index, 1);
        return;
    }
}