import { Card } from "./model/card";
import { Window, WindowConfig } from "./components/window";
import { Story } from "./model/story";
import { el, mount, RedomComponent, unmount } from "redom";
import { Notifications } from "./components/notifier";
import { Panel } from "./components/panel";
import { CommandLine } from "./components/command";
import { Login, Signup } from "./components/authentication"
import { User } from "./model/user";
import { Server } from "./server";
import { Config } from "./config"
import { Header } from "./components/header";
import { Vector, Size } from './geometry'

export class View {
    screen: HTMLElement
    window: Window
    windows: Window[] = [];
    notifier: Notifications
    panel: Panel
    cli: CommandLine
    header: Header

    constructor() {
        this.screen = document.createElement("body")
        mount(document.body, this.screen)
    }

    clear() {
        unmount(document.body, this.screen)
        this.screen = document.createElement("body")
        mount(document.body, this.screen)
    }

    login(): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            console.log("showing login page")
            this.clear()
            let loginPage = new Login((username: string, password: string) => {
                Server.login(username, password).then((user: User) => {
                    resolve(user)
                }).catch((error: any) => {
                    console.log(error)
                    loginPage.update(error)
                })
            })
            mount(this.screen, loginPage)
            let navbar = el(".navbar", [
                el("button", "Use Incognito", { style: { borderRight: "1px solid black" }, onclick: () => { 
                    resolve(this.incognitoMode())
                } }),
                el("button", "Sign Up", {
                    onclick: () => {
                        resolve(this.signup())
                    }
                })
            ])
            mount(this.screen, navbar)
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

    signup(): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            console.log("showing sign up page")
            this.clear()
            let signupPage = new Signup((username: string, email: string, password: string) => {
                Server.signup(username, email, password).then((user: User) => {
                    resolve(user)
                })
            });
            mount(this.screen, signupPage)
            let navbar = el(".navbar", [
                el("button", "Use Incognito", {
                    style: { borderRight: "1px solid black" }, onclick: () => {
                        resolve(this.incognitoMode())
                    }
                }),
                el("button", "Login", {
                    onclick: () => {
                        resolve(this.login())
                    }
                })
            ])
            mount(this.screen, navbar)
        })
    }

    load(story: Story, cards: Card[][], user: User) {
        this.clear()
        let size = new Size(document.body.clientWidth, document.body.clientHeight)
        this.window = new Window(this.screen, cards, new Vector(), size, this.defaultWindowConfig())
        this.windows.push(this.window)
        this.notifier = new Notifications(this.screen)
        this.notifier.info("Welcome to Fablecraft", "This is cool right", () => { alert("you clicked me") })
        this.cli = new CommandLine(this.screen)
        this.header = new Header(this.screen, user.username, story.title)
    }

    splitWindowVertically() {

    }

    splitWindowHorizontally() {

    }

    settings() {
        console.log("showing settings")
        this.panel = new Panel()
    }

    defaultWindowConfig(): WindowConfig {
        return {
            margin: Config.margin,
            card: Config.card,
        }
    }
}

