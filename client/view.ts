import { Card } from "../models/card";
import { Window } from "./components/window";
import { Story } from "./model/story";
import { el, mount, RedomComponent, unmount } from "redom";
import { Notifications } from "./components/notifier";
import { Panel } from "./components/panel";
import { CommandLine } from "./components/command";
import { Login, Signup } from "./components/authentication"
import { User } from "./model/user";
import { Server } from "./server";

export class View {
    screen: HTMLElement
    windows: Window[]
    notifier: Notifications
    panel: Panel
    cli: CommandLine

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
                    loginPage.update(error.message)
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
            id: undefined,
            username: "annonymous",
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

    load(story: Story, cards: Card[], user: User) {
        this.clear()
        this.windows.push(new Window(cards))
        this.add(this.windows[this.windows.length - 1])
        this.cli = new CommandLine(user.username, story.title, 1)
        this.add(this.cli)
    }

    settings() {
        console.log("showing settings")
        this.panel = new Panel()
    }
}

