import { Card } from '../models/card'
import { Story } from '../models/story'
import { User } from '../models/user'
import { View } from './view'
import { Server } from './server'
import { errors } from '../routes/errors'

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

    // static init(user: User): Promise<Model> {
    //     return new Promise<Model>((resolve, reject) => {
    //         Server.getLastStory().then((story) => {
    //             Server.getCards(story._id).then((cards) => {
    //                 resolve(new Model(user, story, cards))
    //             }).catch((err) => {
    //                 console.error(err)
    //                 reject(err)
    //             })
    //         }).catch((err) => { 
    //             switch(err) {
    //                 case errors.StoryNotFound:
    //                     console.log("user doesn't have a story")
    //                     reject(err)
    //             }
    //         })
    //     })
    // }
}