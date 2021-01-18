import { User } from './model/user';
import { Story } from './model/story'
import { Card } from './model/card'
import { View } from './view'
import { Model } from './model/model'
import { Client } from './client'
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

        // set the initial context to be the 
        this.context = this.view.window
    }

    async init() {
        // initialize the model
        if (this.model.user === undefined) {
            let user = await this.getUserProfile()
            if (!user) {
                user = await this.login()
            }

            let story: Story
            try {
                if (user.lastStory) {
                    story = await Client.getStory(user.lastStory)
                } else if (user.stories.length > 0) {
                    story = await Client.getStory(user.stories[0])
                }
            } catch (err) {
                console.log(err)
            }

            let cards: Card[] = []
            if (story) {
                cards = await Client.getCards(story._id).catch((err) => {
                    if (!err.error) {
                        return Client.getCards(story._id)
                    }
                })
            } else {
                // else we create a new empty story
                let { story, rootCard } = await Client.createStory("Untitled")
                story = story
                cards.push(rootCard)
            }
            await this.model.init(user, story, cards)
        }
        // set up the cli
        this.setup.cli()
        this.context.focus()
    }

    async getUserProfile(): Promise<User | undefined> {
        return await Client.getUserProfile()
    }

    async login(): Promise<User> {
        return new Promise<User>((resolve, reject) =>{
            let login = this.view.loginPage((username:string, password:string): void => {
                // we should do some client side verifying here before making the request
                Client.login(username, password)
                    .then((user: User) => resolve(user))
                    .catch((err: string) => login.error(err))
            })
            this.view.navbar([
                {
                    name: "Sign Up",
                    func: () => {
                        resolve(this.signup())
                    }
                },
                {
                    name: "Incognito",
                    func: () => {
                        resolve(this.incognitoMode())
                    }
                }
            ])
        })
    }

    async signup(): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            let signup = this.view.signupPage((username: string, email: string, password: string, confirmPassword: string) => {
                // TODO: client side verification of the users sign up details
                Client.signup(username, email, password)
                    .then((user: User) => resolve(user))
                    .catch((err: string) => signup.error(err))
            })
            this.view.navbar([
                {
                    name: "Log In",
                    func: () => {
                        resolve(this.login())
                    }
                },
                {
                    name: "Incognito",
                    func: () => {
                        resolve(this.incognitoMode())
                    }
                }
            ])
        })
    }

    incognitoMode(): Promise<User> {
        return Promise.resolve({ 
            _id: undefined,
            username: "anonymous",
            lastStory: undefined,
            stories: []
        })
    }

    handleKeyDown(e: KeyboardEvent) {
        console.log(e.key)
        switch(e.key) {
            case "Meta":
            case "Control":
                if (this.view.cli) {
                    if (this.doubleCtrl) {
                        this.context = this.view.cli
                        this.context.focus()
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
                    this.context = this.view.window
                    this.context.focus()
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