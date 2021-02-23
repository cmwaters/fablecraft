// import { Window, WindowConfig } from "../../lib/tree";
// import { el, mount, RedomComponent, unmount } from "redom";
// import { Notifications } from "../components/notifier";
// import { Panel } from "../components/panel";
// import { CommandLine } from "../components/command";
// import { Login, Signup, Navbar } from "../components/authentication"
// import { Client } from "../client";
// import { Page } from "../components/page"
// import { Header } from "../components/header";
// import { Vector, Size } from '../../lib/geometry'
// import * as config from "../config.json"

// export class View {
//     screen: HTMLBodyElement
//     page: Page

//     constructor() {
//         this.screen = document.createElement("body")
//         mount(document.body, this.screen)
//     }

//     clear() {
//         unmount(document.body, this.screen)
//         this.screen = document.createElement("body")
//         mount(document.body, this.screen)
//     }

//     loginPage(callback: (username: string, password: string) => void): Login {
//         this.clear()
//         return new Login(this.screen, callback)
//     }

//     navbar(buttons: {name: string, func: () => void}[]): Navbar {
//         let navbar = new Navbar(this.screen, buttons[0].name, buttons[0].func)
//         for (let i = 1; i < buttons.length; i++) {
//             navbar.add(buttons[i].name, buttons[i].func)
//         }
//         return navbar
//     }

//     signupPage(callback: (username: string, email: string, password: string, confirmPassword: string) => void): Signup {
//         return new Signup(this.screen, callback);
//     }

//     load(story: Story, cards: Card[][], user: User) {
//         this.clear()
//         let size = new Size(document.body.clientWidth, document.body.clientHeight)
//         this.window = new Window(this.screen, story.indexCounter, cards, new Vector(), size, this.defaultWindowConfig())
//         if (cards.length === 1 && cards[0].length === 1 && cards[0][0].text === " ") {
//             this.window.node.focusStart()
//         }
//         this.windows.push(this.window)
//         this.notifier = new Notifications(this.screen)
//         this.notifier.info("Welcome to Fablecraft", "This is cool right", () => { alert("you clicked me") })
//         this.cli = new CommandLine(this.screen)
//         this.header = new Header(this.screen, user.username, story.title)
//         let horizontalLine = el("hr", { style: { position: "absolute", top: "50vh", border: "2px solid black" } })
//         mount(this.screen, horizontalLine)
//     }

//     splitWindowVertically() {

//     }

//     splitWindowHorizontally() {

//     }

//     settings() {
//         console.log("showing settings")
//         this.panel = new Panel()
//     }

//     defaultWindowConfig(): WindowConfig {
//         return {
//             margin: config.margin.pillar,
//             pillar: {
//                 transition: config.movement.defaultTransitionTime,
//                 family: {
//                     margin: config.margin.family,
//                     card: {
//                         margin: config.margin.card
//                     }
//                 },
//                 width: 0,
//                 center: 0
//             },
//             card: config.card,
//         }
//     }
// }
