import { Card } from '../model/card'
import { Story } from './story'
import { User } from './user'
import { View } from '../view'
import { Server } from '../server'

export class Model {
    user: User
    story: Story
    // cards ordered by depth and then index into a 2D array
    cards: Card[][] = []  
    cardIdToPosMap: { [id: string]: CardPos } = {};
    view: View

    constructor(view: View, user?: User, story?: Story) {
        this.view = view
        this.user = user
        this.story = story
    }

    async init(user: User) {
        this.user = user
        // try fetch a story if there is one available 
        if (this.user.lastStory) {
            this.story = await Server.getLastStory()
        } else if (this.user.stories.length > 0) {
            this.story = await Server.getStory(this.user.stories[0])
        }

        // if we have a story then fetch the corresponding cards
        let cards: Card[] = []
        if (this.story) {
            cards = await Server.getCards(this.story._id)
        } else {
            // else we create a new empty story
            let { story, rootCard } = await this.newEmptyStory()
            this.story = story
            cards.push(rootCard)
        }
        // cards from the server may not be correctly ordered
        this.cards = order(cards)
        console.log(this.cards)

        console.log("loading view")
        this.view.load(this.story, this.cards, this.user)
    }

    newEmptyStory(): Promise<{story: Story, rootCard: Card}> {
        return Server.createStory("Untitled")
    } 

    

}

export type CardPos = {
    depth: number,
    index: number
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
        for (let bucketIdx = startIndex; bucketIdx < buckets.length; bucketIdx) {
            
            if (!cards[index].above) {
                // if this card does not have any card above it, it is therefore the 
                // first card and goes in it's own bucket
                buckets[0] = [cards[index]]
            }
            let last = buckets[bucketIdx].length - 1
            if (buckets[bucketIdx][last].below! === cards[index].above) {
                // if this connects with the last card of the bucket then add it to that bucket
                buckets[bucketIdx].push(cards[index])
                break;
            } else if (bucketIdx === buckets.length - 1) {
                // if this is the last bucket that we have tried to match then just append this new card to the end
                buckets.push([cards[index]])
            }
        }
    }
    return merge(buckets)
}

function merge(buckets: Card[][]): Card[] {
    while (buckets.length > 1) {
        for (let i = 1; i < buckets.length; i++) {
            if (buckets[i][0].above! === buckets[0][buckets[0].length - 1].below!) {
                buckets[0].push(...buckets[i])
                buckets.slice(i, 1)
            }
        }
    }
    return buckets[0]
}