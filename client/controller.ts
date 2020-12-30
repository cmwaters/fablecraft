import { User } from './model/user';
import { View } from './view'
import { Model } from './model/model'
import { Server } from './server'

export class Controller {
    model: Model
    view: View

    shiftMode: boolean = false;
    ctrlMode: boolean = false;
    doubleCtrl: boolean = false;

    constructor(model: Model, view: View) {
        this.model = model
        this.view = view

        document.onkeydown = (e: KeyboardEvent) => {
            this.handleKeyDown(e)
        }

        document.onkeyup = (e: KeyboardEvent) => {
            this.handleKeyUp(e)
        }
    }

    async init() {
        if (this.model.user === undefined) {
            let user = await this.getUserProfile()
            if (!user) {
                user = await this.view.login()
            }
            await this.model.init(user)
        }
        if (this.view.cli) {
            this.view.cli.setCommands([
                { 
                    name: "Settings",
                    aliases: [],
                    cmd: () => {
                        this.view.settings()
                    }
                }
            ])
        }
    }

    async getUserProfile(): Promise<User | undefined> {
        return await Server.getUserProfile()
    }

    handleKeyDown(e: KeyboardEvent) {
        console.log(e.key)
        switch(e.key) {
            case "Meta":
            case "Control":
                if (this.doubleCtrl) {
                    if (this.view.cli) {
                        this.view.cli.focus()
                        this.view.context = this.view.cli
                    }
                }
                this.doubleCtrl = true;
                this.ctrlMode = true;
                setTimeout(() => {
                    this.doubleCtrl = false
                }, 500)
                break;
            case "Shift":
                this.shiftMode = true;
                break;
            case "Escape":
                if (this.view.context) {
                    this.view.context.blur()
                }
        }
    }

    handleKeyUp(e: KeyboardEvent) {
        switch (e.key) {
            case "Meta":
            case "Control":
                this.ctrlMode = false;
                break;
            case "Shift":
                this.shiftMode = false;
                break;
        }
    }
 
}