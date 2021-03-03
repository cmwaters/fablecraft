// import { View } from './view'
// import { Model } from './model'

import { el } from 'redom'
import { Tree, defaultConfig } from 'fabletree'

// const inverseScrollSpeed = 2;

// const NEW_STORY_TITLE = "Untitled"

window.onload = () => {
    console.log("Hello World")
    
    let div = el("div.window")
    document.body.appendChild(div)

    let tree = new Tree(div, defaultConfig())


    // Fablecraft.start()
}

// export class Fablecraft {
//     model: Model
//     view: View
//     shiftMode: boolean = false;
//     ctrlMode: boolean = false;
//     altMode: boolean = false;
//     doubleCtrl: boolean = false;
//     // nothing is saved
//     incognito: boolean = false;

//     constructor(view: View, model: Model) {
//         this.view = view
//         this.model = model

//         document.onkeydown = (e: KeyboardEvent) => {
//             this.handleKeyDown(e)
//         }

//         document.onkeyup = (e: KeyboardEvent) => {
//             this.handleKeyUp(e)
//         }

//         window.onresize = () => {
//             let newSize = new Size(window.innerWidth, window.innerHeight)
//             this.view.window.resize(newSize)
//         }

//         window.onmousewheel = (e: WheelEvent) => {
//             if (this.shiftMode) {
//                 this.wheelSlide(new Vector(-e.deltaY, -e.deltaX).divide(inverseScrollSpeed))
//             } else {
//                 this.wheelSlide(new Vector(-e.deltaX, -e.deltaY).divide(inverseScrollSpeed))
//             }
//         };
//     }

//     static start() {

//     }

    // async login(): Promise<User> {
    //     return new Promise<User>((resolve, reject) =>{
    //         this.view.clear()
    //         let login = this.view.loginPage((username:string, password:string): void => {
    //             // we should do some client side verifying here before making the request
    //             Client.login(username, password)
    //                 .then((user: User) => resolve(user))
    //                 .catch((err: string) => login.error(err))
    //         })
    //         this.focus(login)
    //         this.view.navbar([
    //             {
    //                 name: "Incognito",
    //                 func: () => {
    //                     resolve(this.incognitoMode())
    //                 }
    //             },
    //             {
    //                 name: "Sign Up",
    //                 func: () => {
    //                     resolve(this.signup())
    //                 }
    //             }
    //         ])
    //     })
    // }

    // async signup(): Promise<User> {
    //     return new Promise<User>((resolve, reject) => {
    //         this.view.clear()
    //         let signup = this.view.signupPage((username: string, email: string, password: string, confirmPassword: string) => {
    //             if (password !== confirmPassword) {
    //                 signup.error("Passwords don't match.")
    //             }
    //             // TODO: client side verification of the users sign up details
    //             Client.signup(username, email, password)
    //                 .then((user: User) => resolve(user))
    //                 .catch((err: string) => signup.error(err))
    //         })
    //         this.focus(signup)
    //         this.view.navbar([
    //             {
    //                 name: "Incognito",
    //                 func: () => {
    //                     resolve(this.incognitoMode())
    //                 }
    //             }, 
    //             {
    //                 name: "Log In",
    //                 func: () => {
    //                     resolve(this.login())
    //                 }
    //             }
    //         ])
    //     })
    // }

    // async loadStory(user: User): Promise<{story: Story, cards: Card[]}> {
    //     // if in incognito mode then create a new story locally
    //     if (this.incognito) {
    //         return { 
    //             story: {
    //                 _id: undefined,
    //                 title: NEW_STORY_TITLE,
    //                 owner: user._id
    //             },
    //             cards: [
    //                 {
    //                     _id: undefined,
    //                     text: " ",
    //                     story: undefined,
    //                     depth: 0, 
    //                     index: 0,
    //                 }
    //             ]
    //         }
    //     }

    //     // retrieve the last story the user has or the first in the
    //     // list of stories the user is associated with
    //     let story: Story
    //     try {
    //         if (user.lastStory) {
    //             story = await Client.getStory(user.lastStory)
    //         } else if (user.stories.length > 0) {
    //             story = await Client.getStory(user.stories[0])
    //         }
    //     } catch (err) {
    //         console.log(err)
    //     }

    //     // retrieve the corresponding cards to that story
    //     let cards: Card[] = []
    //     if (story) {
    //         cards = await Client.getCards(story._id).catch((err) => {
    //             if (!err.error) {
    //                 return Client.getCards(story._id)
    //             }
    //         })
    //     } else {
    //         // else we create a new empty story
    //         let { story, rootCard } = await Client.createStory(NEW_STORY_TITLE)
    //         story = story
    //         cards = [rootCard]
    //     }
    //     return { story, cards }
    // }

    // incognitoMode(): Promise<User> {
    //     this.incognito = true;
    //     return Promise.resolve({ 
    //         // by checking _id, the client will know if the user is in incognito mode
    //         // and wants to make requests to the server.
    //         _id: undefined,
    //         username: "Incognito Mode",
    //         lastStory: undefined,
    //         stories: []
    //     })
    // }

    // focus(object?: ViewComponent): void {
    //     if (this.context) {
    //         this.context.blur()
    //     }

    //     if (object) {
    //         this.context = object
    //     } else if (this.defaultContext) {
    //         this.context = this.defaultContext
    //     }
    //     if (this.context) {
    //         this.context.focus()
    //     }
    // }

    // escape(): void {
    //     if (this.defaultContext) {
    //         this.focus()
    //     } else {
    //         this.context.blur()
    //         this.context = null
    //     }
    // }

    // handleKeyDown(e: KeyboardEvent) {
    //     console.log(e.key)
    //     switch(e.key) {
    //         case "Meta":
    //         case "Control":
    //             if (this.view.cli) {
    //                 if (this.doubleCtrl) {
    //                     this.focus(this.view.cli)
    //                 }
    //             }
    //             this.doubleCtrl = true;
    //             this.ctrlMode = true;
    //             setTimeout(() => {
    //                 this.doubleCtrl = false
    //             }, 500)
    //             break;
    //         case "Alt":
    //             this.altMode = true;
    //             break;
    //         case "Shift":
    //             this.shiftMode = true;
    //             break;
    //         case "Escape":
    //             if (this.context) {
    //                 this.escape()
    //             }
    //             break;
    //         default:
    //             if (this.context) {
    //                 this.context.key(e.key, this.ctrlMode, this.altMode, this.shiftMode)
    //             }
    //     }
    // }

    

    // handleKeyUp(e: KeyboardEvent) {
        
    // }

    // wheelSlide(delta: Vector) {
    //     this.view.window.pan(delta)
    // }

    // setup = {
    //     cli: () => {
    //         if (this.view.cli) {
    //             this.view.cli.onclick(() => {
    //                 this.context = this.view.cli
    //                 this.view.cli.focus()
    //             })
    //             // set all the commands
    //             this.view.cli.setCommands([
    //                 {
    //                     name: "Settings",
    //                     aliases: [],
    //                     cmd: () => {
    //                         this.view.settings()
    //                     }
    //                 }
    //             ])
    //         }
    //     }
    // }
 
// }