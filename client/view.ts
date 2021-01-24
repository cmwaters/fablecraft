import { Card } from "./model/card";
import { Window, WindowConfig } from "./components/window";
import { Story } from "./model/story";
import { el, mount, RedomComponent, unmount } from "redom";
import { Notifications } from "./components/notifier";
import { Panel } from "./components/panel";
import { CommandLine } from "./components/command";
import { Login, Signup, Navbar } from "./components/authentication"
import { User } from "./model/user";
import { Client } from "./client";
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

    loginPage(callback: (username: string, password: string) => void): Login {
        this.clear()
        return new Login(this.screen, callback)
    }

    navbar(buttons: {name: string, func: () => void}[]): Navbar {
        let navbar = new Navbar(this.screen, buttons[0].name, buttons[0].func)
        for (let i = 1; i < buttons.length; i++) {
            navbar.add(buttons[i].name, buttons[i].func)
        }
        return navbar
    }

    signupPage(callback: (username: string, email: string, password: string, confirmPassword: string) => void): Signup {
        return new Signup(this.screen, callback);
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
        let horizontalLine = el("hr", { style: { position: "absolute", top: "50vh", border: "2px solid black" } })
        mount(this.screen, horizontalLine)
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

