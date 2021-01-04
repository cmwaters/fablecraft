import { Card } from '../model/card'
import { User } from '../model/user'
import { Story } from '../model/story'

const TEST_CARD_TEXT = "This is a test card"

export function createCardFamily(story: string, quantity: number, startingIndex?: number,
    depth?: number, parent?: string, above?: string, below?: string): Card[] {
    if (!startingIndex) {
        startingIndex = 0
    }
    let cards: Card[] = [];
    for (let i = 0; i < quantity; i++) {
        cards.push(createCard(story, startingIndex + i, depth))
    }
    return combineCards(cards, parent, above, below)
}

export function createCard(story: string, index?: number, depth?: number): Card {
    let card = {
        _id: Math.round(Math.random() * 100000).toString(),
        text: TEST_CARD_TEXT,
        story: story,
        index: 0,
        depth: 0,
    }
    if (index) card.index = index
    if (depth) card.depth = depth
    return card
}

export function combineCards(cards: Card[], parent?: string, above?: string, below?: string): Card[] {
    for (let i = 0; i < cards.length; i++) {
        if (i === 0) {
            cards[i].above = above
        } else {
            cards[i].above = cards[i - 1]._id
        }
        if (i === cards.length - 1) {
            cards[i].below = below
        } else {
            cards[i].below = cards[i + 1]._id
        }
        cards[i].parent = parent
    }
    return cards
}

export function createStory(title: string, owner: string, authors?: string[], editors?: string[], viewers?: string[]): Story {
    return {
        _id: title,
        owner: owner,
        title: title,
        authors: authors,
        editors: editors,
        viewers: viewers,
    }
}

export function createUser(name: string): User {
    return {
        _id: name,
        username: name,
        email: name + "@example.com",
        stories: [],
    }
}

export function validateCards(cards: Card[][]): boolean {
    return true
}

export function validateCardFamily(cards: Card[], depth?: number, parent?: string, above?: string, below?: string): string {
    for (let i = 0; i < cards.length; i++) {
        // validate depth
        if (depth && depth != cards[i].depth) {
            return "invalid depth"
        }
        // validate parent
        if (parent && (cards[i].parent === undefined || cards[i].parent !== parent)) {
            return "invalid parent"
        }
        // validate above
        if (i === 0 ) {
            if (cards[i].above !== above) {
                return "invalid above - should be " + above
            }
        } else {
            if (cards[i].above !== cards[i-1]._id) {
                return "invalid above - should be " + cards[i-1]._id
            }
        }
        // validate below
        if (i === cards.length - 1) {
            if (cards[i].below !== below) {
                return "invalid below - should be " + below
            }
        } else {
            if (cards[i].below !== cards[i + 1]._id) {
                return "invalid below - should be " + cards[i + 1]._id
            }
        }

    }
    return "valid"
}