import { Header } from './components/header'
import { View } from './view'

export type Card = {
    id: string
    identifier: number;
    text: string;
    story: string;
    depth: number;
    height: number;
    parent?: number;
    children?: number[]; // unordered list of children
    above?: string;
    below?: string;
}

export type Header = {
    id: string,
    title: string,
    owner: string
    indexCounter: number,
    description?: string,
    authors?: string[]
    editors?: string[]
    viewers?: string[]
}

export type User = {
    id: string,
    username: string,
    email?: string,
    lastStory?: any,
    stories: string[]
}

export class Model {
    header: Header
    // cards ordered by horizontal (depth) and then vertical position into a 2D array
    cards: Card[][] = []  

    constructor() {
        this.header = 
    }

    async init(user: User, document: Document, cards: Card[]) {
        this.user = user
        this.cards = order(cards)
        this.document = document
        this.view.load(this.document, this.cards, this.user)
    }

    

}

// Order takes a list of cards ordered by depth first and index second and splits them
// into their corresponding depths and then performs an insertion sort for each column to make sure they 
// are in the correct order i.e. card.bottom refers to the card with one index greater and card.top
// refers to the card with one index lower. 
export function order(cards: Card[]): Card[][] {
    let result: Card[][] = [];
    // we assume that depth always starts at 0
    let depth = 0
    let lastIndex = 0
    for (let i = 1; i < cards.length; i++) {
        if (cards[i].depth === depth + 1) {
            result.push(cards.slice(lastIndex, i))
            lastIndex = i
            depth++
        }
    }
    result.push(cards.slice(lastIndex, cards.length))
    for (let i = 0; i < result.length; i++) {
        result[i] = insertSort(result[i])
    }
    return result
}

function insertSort(cards: Card[]): Card[] {
    let buckets: Card[][] = [];
    // if this is the first card then add it to the first bucket
    // else add it to the second bucket
    if (!cards[0].above) {
        buckets = [[cards[0]]]
    } else {
        buckets = [[], [cards[0]]]
    }
    for (let index = 1; index < cards.length; index++) {
        let startIndex = 0
        if (buckets[0].length === 0) {
            startIndex = 1
        } 
        for (let bucketIdx = startIndex; bucketIdx < buckets.length; bucketIdx++) {
            if (!cards[index].above) {
                // if this card does not have any card above it, it is therefore the 
                // first card and goes in it's own bucket
                buckets[0] = [cards[index]]
                break;
            }
            let last = buckets[bucketIdx].length - 1
            if (buckets[bucketIdx][last].id === cards[index].above) {
                // if this connects with the last card of the bucket then add it to that bucket
                buckets[bucketIdx].push(cards[index])
                break;
            } else if (bucketIdx === buckets.length - 1) {
                // if this is the last bucket that we have tried to match then just append this new card to the end
                buckets.push([cards[index]])
                break;
            }
        }
    }
    return merge(buckets)
}

function merge(buckets: Card[][]): Card[] {    
    while (buckets.length > 1) {
        for (let i = 1; i < buckets.length; i++) {
            if (buckets[i][0].above! === buckets[0][buckets[0].length - 1]._id) {
                buckets[0].push(...buckets[i])
                buckets.splice(i, 1)
            }
        }
    }
    return buckets[0]
}

