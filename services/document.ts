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
            let rootCard = await CardModel.create({
                document: document.id,
                depth: 0,
                index: 1,
                text: " ", // needs to be something
            }, { session: session });

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

    // static async load(user: User, id: string): Promise<Document> {

    // }

    // static async delete(user: User, id: string): Promise<Document> {
    //     DocumentModel.findById(id, null, null, (err, doc) => {
    //         if (err) { console.error(err) }
    //     })
    // }

    createCardAbove() {

    }

    createCardBelow() {

    }

    updateCard() {

    }

    deleteCard() {

    }

    createPermission() {

    }

    deletePermission() {

    }

    private cardIndex(): number {
        this.header.cards++
        this.header.save()
        return this.header.cards
    }

    private getPermission(user: User): PermissionGroup {
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
}