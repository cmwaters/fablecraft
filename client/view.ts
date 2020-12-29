import { Card } from "./card";
import { Size, Vector, Geometry } from "./types";
import { Config } from "./config";
import { Window } from "./components/window";
import { Story, Node } from "./story";
import { el, mount, RedomComponent, unmount } from "redom";
import { Notifications } from "./components/notifier";
import { Panel } from "./components/panel";
import { CommandLine } from "./components/command";
import { Login, Signup } from "./components/authentication"
import { User } from "../models/user";
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

    login(loginFunc: (user: User) => void) {
        console.log("showing login page")
        this.clear()
        let loginPage = new Login((username: string, password: string) => {
            Server.login(username, password).then((user: User) => {
                loginFunc(user)
            }).catch((error: any) => {
                console.log(error)
                loginPage.update(error.message)
            })
        })
        this.add(loginPage)
        let navbar = el(".navbar", [
            el("button", "Use Incognito", { style: { borderRight: "1px solid black" } }),
            el("button", "Sign Up", {
                onclick: () => {
                    this.signup(loginFunc)
                }
            })
        ])
        this.add(navbar)
    }

    signup(signupFunc: (user: User) => void) {
        console.log("showing sign up page")
        this.clear()
        let signupPage = new Signup((username: string, email:string, password: string) => {
            Server.signup(username, email, password).then((user: User) => {
                signupFunc(user)
            })
        });
        this.add(signupPage)
        let navbar = el(".navbar", [
            el("button", "Use Incognito", { style: { borderRight: "1px solid black" } }),
            el("button", "Login", {
                onclick: () => {
                    this.login(signupFunc)
                }
            })
        ])
        this.add(navbar)

    }
}
