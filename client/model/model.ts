import { Card } from '../../models/card'
import { Story } from './story'
import { User } from './user'
import { View } from '../view'
import { Server } from '../server'

export class Model {
    user: User
    story: Story
    cards: Card[] = []
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
        if (this.story) {
            this.cards = await Server.getCards(this.story._id)
        } else {
            // else we create a new empty story
            let { story, rootCard } = await this.newEmptyStory()
            this.story = story
            this.cards.push(rootCard)
        }
        console.log("loading view")
        this.view.load(this.story, this.cards, this.user)
    }

    newEmptyStory(): Promise<{story: Story, rootCard: Card}> {
        return Server.createStory("Untitled")
    } 

}