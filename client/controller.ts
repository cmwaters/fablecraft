import { User } from './model/user';
import { Story } from './model/story'
import { Card } from './model/card'
import { View } from './view'
import { Model } from './model/model'
import { Client } from './client'
import { ViewComponent } from "./components/view_component"
import { Vector } from './geometry'

const inverseScrollSpeed = 2;

const NEW_STORY_TITLE = "Untitled"

export class Controller {
    model: Model
    view: View
    context: ViewComponent
    shiftMode: boolean = false;
    ctrlMode: boolean = false;
    doubleCtrl: boolean = false;
    // nothing is saved
    incognito: boolean = false;

    constructor(view: View) {
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

    static async init(view: View) {
        let controller = new Controller(view)

        // initialize the model
        if (!this.model.user) {
            // check if the user is already logged in (prior session is saved and still valid)
            let user = await Client.getUserProfile()
            if (!this.model.user) {
                // if not require the user to login (the user can also switch to signup)
                this.model.user = await this.login()
            }
        }

        // load either the most recent story in the db, the first available one
        // in the db, or if there is either none or in incognito mode, create a new story.
        let {story, cards} = await this.loadStory(this.model.user)

        // init the model and load the view of the story
        await this.model.init(this.model.user, story, cards)

        // set up the cli
        this.setup.cli()

        // focus on the default window
        this.context.focus()
    }

    async login(): Promise<User> {
        return new Promise<User>((resolve, reject) =>{
            this.view.clear()
            let login = this.view.loginPage((username:string, password:string): void => {
                // we should do some client side verifying here before making the request
                Client.login(username, password)
                    .then((user: User) => resolve(user))
                    .catch((err: string) => login.error(err))
            })
            this.view.navbar([
                {
                    name: "Incognito",
                    func: () => {
                        resolve(this.incognitoMode())
                    }
                },
                {
                    name: "Sign Up",
                    func: () => {
                        resolve(this.signup())
                    }
                }
            ])
        })
    }

    async signup(): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            this.view.clear()
            let signup = this.view.signupPage((username: string, email: string, password: string, confirmPassword: string) => {
                if (password !== confirmPassword) {
                    signup.error("Passwords don't match.")
                }
                // TODO: client side verification of the users sign up details
                Client.signup(username, email, password)
                    .then((user: User) => resolve(user))
                    .catch((err: string) => signup.error(err))
            })
            this.view.navbar([
                {
                    name: "Incognito",
                    func: () => {
                        resolve(this.incognitoMode())
                    }
                }, 
                {
                    name: "Log In",
                    func: () => {
                        resolve(this.login())
                    }
                }
            ])
        })
    }

    async loadStory(user: User): Promise<{story: Story, cards: Card[]}> {
        // if in incognito mode then create a new story locally
        if (this.incognitoMode) {
            return { 
                story: {
                    _id: undefined,
                    title: NEW_STORY_TITLE,
                    owner: user._id
                },
                cards: [
                    {
                        _id: undefined,
                        text: " ",
                        story: undefined,
                        depth: 0, 
                        index: 0,
                    }
                ]
            }
        }

        // retrieve the last story the user has or the first in the
        // list of stories the user is associated with
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

        // retrieve the corresponding cards to that story
        let cards: Card[] = []
        if (story) {
            cards = await Client.getCards(story._id).catch((err) => {
                if (!err.error) {
                    return Client.getCards(story._id)
                }
            })
        } else {
            // else we create a new empty story
            let { story, rootCard } = await Client.createStory(NEW_STORY_TITLE)
            story = story
            cards = [rootCard]
        }
        return { story, cards }
    }

    incognitoMode(): Promise<User> {
        this.incognito = true;
        return Promise.resolve({ 
            // by checking _id, the client will know if the user is in incognito mode
            // and wants to make requests to the server.
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