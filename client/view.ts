import { Card } from "./card";
import { Size, Vector, Geometry } from "./types";
import { Config } from "./config";
import { Window } from "./components/window";
import { Story, Node } from "./story";
import { el, mount, unmount } from "redom";
import { Notifications } from "./components/notifier";
import { Panel } from "./components/panel";
import { CommandLine } from "./components/command";
import { Login, Signup } from "./components/authentication"

let g = Geometry;
const inverseScrollSpeed = 2;

export class View {
    windows: Window[]
    notifier: Notifications
    panel: Panel
    cli: CommandLine

    contructor() {}

    login(loginFunc: (username: string, password: string) => void) {
        console.log("showing login page")
        let loginPage = new Login(loginFunc)
        mount(document.body, loginPage);
        let navbar = el(".navbar", [
            el("button", "Use Incognito", { style: { borderRight: "1px solid black"}}),
            el("button", "Sign Up", { onclick: () => { 
                unmount(document.body, loginPage)
                unmount(document.body, navbar)
                this.signup() 
            }})
        ])
        mount(document.body, navbar)
    }

    signup() {
        console.log("showing sign up page")
        mount(document.body, new Signup());
    }
}
