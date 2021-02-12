import { User, UserModel } from '../models/user'
import { Card, CardModel } from '../models/card'
import { DocumentHeader } from '../models/header'
import { PermissionGroup } from '../services/permissions'
import { Document } from '../services/document'
import { LoremIpsum } from "lorem-ipsum";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 4
    },
    wordsPerSentence: {
        max: 16,
        min: 4
    }
});

export class Generator {
    documents: { [title: string]: Document } = {};
    users: { [name: string]: User } = {};
    currentDocument: string = "";

    constructor(users?: { [name: string]: User }, documents?: { [title: string]: Document}) {
        if (users) this.users = users
        if (documents) this.documents = documents
    }

    static async createUsers(users: string[]): Promise<Generator> {
        let newUsers: { [name: string]: User } = {};
        try {
            for (const user of users) {
                const salt = randomBytes(32);
                const passwordHashed = await argon2.hash(user, { salt });
                newUsers[user] = await UserModel.create({
                    username: user,
                    email: user + "@example.com",
                    password: passwordHashed,
                    documents: [],
                    lastDocument: undefined,
                    name: user,
                })
            }
        } catch(err) { throw err; }
        return new Generator(newUsers)
    }

    async createStory(user: string, title: string, cards: number = 1): Promise<Generator> {
        let u = this.users[user]
        try {
            this.documents[title] = await Document.create(u, title)
        } catch (error) { throw error }
        this.currentDocument = title
        if (cards > 1) {
            return this.addRootCards(cards - 1)
        }
        return this
    }

    card(depth: number, row: number, document: string = this.currentDocument): Card {
        for (let card of this.documents[document].cards) {
            if (card.depth == depth) {
                if (row === 0) {
                    return card
                }
                row--
            }  
        }
        throw new Error("No card at depth: " + depth + " and row " + row)
    }

    async addCardFamily(parent: Card, cards: number, document: string = this.currentDocument): Promise<Generator> {
        let doc = this.documents[document]
        let u = doc.header.owner
        for (let i = 0; i < cards; i++) {
            doc.cards.push(await doc.addChildCard(u, parent._id, lorem.generateParagraphs(randInt(3, 1))))
        }
        return this
    }

    // CONTRACT: should be called before adding any families
    async addRootCards(cards: number, document: string = this.currentDocument): Promise<Generator> {
        let doc = this.documents[document]
        let u = doc.header.owner

        let lastCard = doc.cards[doc.cards.length - 1]
        if (lastCard.depth != 0) {
            throw new Error("addRootCards should be called first. Last card does not have a depth of 0")
        }
        for (let i = 0; i < cards; i++) {
            let card = await doc.addCardBelow(u, lastCard._id, lorem.generateParagraphs(randInt(1, 3)))
            doc.cards.push(card)
            lastCard = card
        }
        return this
    }

    // permission is enacted as if it were by the owner
    async addPermission(user: string, document: string, permission: PermissionGroup): Promise<Generator> {
        let doc = this.documents[document]
        let owner = this.users[doc.header.owner._id]
        await doc.addPermission(owner, user, permission)
        return this
    }
}

async function generateCards(document: DocumentHeader, depth: number, range: number, parent?: Card, above?: Card, below?: Card): Promise<Card[]> {
    let column = [];
    for (let index = 0; index < range; index++) {
        column.push(await CardModel.create({
            document: document._id,
            text: lorem.generateParagraphs(1),
            depth: depth,
            index: document.cards + index + 1,
        }))
    }

    document.cards += range
    await document.save()

    for (let index = 0; index < range; index++) {
        if (parent !== undefined) {
            column[index].parent = parent._id
            parent.children!.push(column[index]._id)
        }
        if (index !== 0) {
            column[index].above = column[index - 1]._id
        } else if (above) {
            column[index].above = above._id
            above.below = column[index]._id
            await above.save()
        }
        if (index !== range - 1) {
            column[index].below = column[index + 1]._id
        } else if (below) {
            column[index].below = below._id 
            below.above = column[index]._id
            await below.save()
        }
        await column[index].save()
    }

    if (parent !== undefined) {
        await parent.save()
    }

    return column
} 

function randInt(upper: number, lower: number = 0): number {
    return Math.floor(Math.random() * upper) - lower
}
