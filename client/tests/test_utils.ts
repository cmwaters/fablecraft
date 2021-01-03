import { Card } from '../../models/card'
import { User } from '../model/user'
import { Story } from '../model/story'

const TEST_CARD_TEXT = "This is a test card"

export function createCardFamily(story: Story, quantity: number, parent?: string, above?: string, below?: string): Card[] {
    let cards: Card[] = [];
    for (let i = 0; i < quantity; i++) {
        cards.push(new CardModel{
            text: TEST_CARD_TEXT,
            story: story,

        })
    }

}

export function createCard()

export function createStory(title: string, user: User) {

}

export function createUser(name: string): User {
    return {
        id: name,
        username: name,
        email: name + "@example.com",
        stories: [],
    }
}