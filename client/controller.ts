import { User } from '../models/user';
import { View } from './view'
import { Model } from './model'
import { Server } from './server'
import { Story } from '../models/story';

export class Controller {
    model: Model
    view: View

    constructor(model: Model, view: View) {
        this.model = model
        this.view = view

        if (this.model.user === undefined) {
            this.getUserProfile().then((user) => {
                this.initModel(user)
            }).catch((err) => {
                if (err.response.status === 401) {
                    this.view.login(this.initModel)
                } else {
                    console.error(err)
                }
            })
        }
    }

    getUserProfile(): Promise<User> {
        return Server.getUserProfile()
    }

    initModel(user: User): void {
        this.model.user = user
        Server.getLastStory().then((story: Story) => {
            this.model.story = story
            Server.getCards(this.model.story._id).then(cards => {
                this.model.cards = cards
            })
        }) 
    }

 
}