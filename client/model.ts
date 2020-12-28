import { Card } from '../models/card'
import { Story } from '../models/story'
import { User } from '../models/user'
import { Server } from './server'
import { errors } from '../routes/errors'
import Axios from 'axios'

export class Model {
    user: User
    story: Story
    cards: Card[]

    constructor(user: User, story: Story, cards: Card[]) {
        this.user = user
        this.story = story
        this.cards = cards
    }

    static init(user: User): Promise<Model> {
        return new Promise<Model>((resolve, reject) => {
            Server.getLastStory().then((story) => {
                Server.getCards(story._id).then((cards) => {
                    resolve(new Model(user, story, cards))
                }).catch((err) => {
                    console.error(err)
                    reject(err)
                })
            }).catch((err) => { 
                switch(err) {
                    case errors.StoryNotFound:
                        console.log("user doesn't have a story")
                        reject(err)
                }
            })
        })
    }
}