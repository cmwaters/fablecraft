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
                    if (this.view.cli.hasFocus()) {
                        this.view.cli.focus()
                    } else if (this.doubleCtrl) {
                        this.view.cli.focus()
                        this.context = this.view.cli
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
                if (this.context) {
                    this.context.blur()
                }
                break;
            case "ArrowUp":
                this.view.window.up()
                break
            case "ArrowDown":
                this.view.window.down()
                break
            case "ArrowLeft":
                this.view.window.left()
                break;
            case "ArrowRight":
                this.view.window.right()
                break;

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