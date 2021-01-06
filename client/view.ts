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
import { Vector } from './geometry'

export class View {
    screen: HTMLElement
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

    add(component: RedomComponent | HTMLElement) {
        mount(this.screen, component)
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
            this.add(loginPage)
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
            this.add(navbar)
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
            this.add(signupPage)
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
            this.add(navbar)
        })
    }

    load(story: Story, cards: Card[][], user: User) {
        this.clear()
        let size = { width: document.body.clientWidth, height: document.body.clientHeight}
        this.windows.push(new Window(cards, {x: 0, y: 0}, size, this.defaultWindowConfig()))
        this.add(this.windows[this.windows.length - 1])
        this.notifier = new Notifications()
        this.add(this.notifier)
        this.notifier.info("Welcome to Fablecraft", "This is cool right", () => { alert("you clicked me") })
        this.cli = new CommandLine()
        this.add(this.cli)
        this.header = new Header(user.username, story.title)
        this.add(this.header)
    }

    shiftActiveWindow(delta: Vector) {
        for (const window of this.windows) {
            if (window.hasFocus()) {
                window.shift(delta)
            }
        }
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

