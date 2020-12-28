import { Card } from "./card";
import { Size, Vector, Geometry } from "./types";
import { Config } from "./config";
import { Window } from "./components/window";
import { Story, Node } from "./story";
import { el, mount } from "redom";
import { Notifications } from "./components/notifier";
import { Panel } from "./components/panel";
import { CommandLine } from "./components/command";
import { Login } from "./components/login"

let g = Geometry;
const inverseScrollSpeed = 2;

export class View {
    windows: Window[]
    notifier: Notifications
    panel: Panel
    cli: CommandLine

    contructor() {}

    login() {
        console.log("showing login page")
        mount(document.body, new Login())
    }
}
