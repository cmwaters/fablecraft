import { User } from '../models/user';
import { View } from './view'
import { Model } from './model'
import { Server } from './server'

export class Controller {
    model: Model
    view: View

    // static init() {
    //     let view = new View();
    //     this.getUserProfile().then((user: User) => {
    //         Model.init(user).then((model: Model) => {
    //             let controller = new Controller(model, view)
    //         }).catch((err) => {
    //             console.log(err)
    //         })
    //     }).catch((err) => {
    //         if (err.response.status === 401) {
    //             // the user needs to login first
    //             view.login(Controller.loginUser)
    //         } else {
    //             console.log(err)
    //         }
    //     })
    // }  

    constructor(model: Model, view: View) {
        this.model = model
        this.view = view

        if (this.model.user === undefined) {
            this.getUserProfile().then((user) => {
                this.model.user = user
            }).catch((err) => {
                if (err.response.status === 401) {
                    this.view.login(this.loginUser)
                } else {
                    console.error(err)
                }
            })
        }
    }

    getUserProfile(): Promise<User> {
        return Server.getUserProfile()
    }

    loginUser(username: string, password: string): void {
        Server.login(username, password)
    }

 
}