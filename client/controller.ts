import { User } from './model/user';
import { View } from './view'
import { Model } from './model/model'
import { Server } from './server'
import { ViewComponent } from "./components/view_component"
import { Vector } from './geometry'

const inverseScrollSpeed = 2;

export class Controller {
    model: Model
    view: View
    context: ViewComponent
    contextTree: ViewComponent[] = []
    switchContext: (newContext: ViewComponent | null) => void
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

        window.onmousewheel = (e: WheelEvent) => {
            if (this.shiftMode) {
                this.wheelSlide(new Vector(-e.deltaY, -e.deltaX).divide(inverseScrollSpeed))
            } else {
                this.wheelSlide(new Vector(-e.deltaX, -e.deltaY).divide(inverseScrollSpeed))
            }
        };

        this.switchContext = (newContext: ViewComponent | null): void => {
            if (newContext) {
                this.contextTree.push(newContext)
                this.context = newContext
                this.context.focus(this.switchContext)
            } else if (this.contextTree.length > 0) {
                this.context = this.contextTree.pop()
            }
        }
        this.switchContext.bind(this)
    }

    async init() {
        // initialize the model
        if (this.model.user === undefined) {
            let user = await this.getUserProfile()
            if (!user) {
                user = await this.view.login()
            }
            await this.model.init(user)
        }
        // set up the cli
        this.setup.cli()
        // set the initial context to be the 
        this.context = this.view
        this.context.focus(this.switchContext)
    }

    async getUserProfile(): Promise<User | undefined> {
        return await Server.getUserProfile()
    }

    handleKeyDown(e: KeyboardEvent) {
        console.log(e.key)
        switch(e.key) {
            case "Meta":
            case "Control":
                if (this.view.cli) {
                    if (this.doubleCtrl) {
                        this.contextTree.push(this.context)
                        this.context = this.view.cli
                        this.context.focus(this.switchContext)
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
                if (this.context && this.contextTree.length > 0) {
                    this.context.blur()
                    this.context = this.contextTree.pop()
                    this.context.focus(this.switchContext)
                }
                break;
            default:
                this.context.key(e.key, this.shiftMode, this.ctrlMode)
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

    wheelSlide(delta: Vector) {
        this.view.window.pan(delta)
    }

    setup = {
        cli: () => {
            if (this.view.cli) {
                this.view.cli.onclick(() => {
                    this.context = this.view.cli
                    this.view.cli.focus()
                })
                // set all the commands
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
    }
 
}