import { RedomComponent, el, svg, mount } from "redom";
import { ViewComponent } from "./view_component";

export class Header implements RedomComponent {
    el: HTMLElement;
    username: HTMLElement;
    userIcon: SVGElement;
    storyTitle: HTMLElement;
    storyIcon: SVGElement;

    constructor(parent: HTMLElement, username: string, title: string) {
        this.userIcon = svg("svg", { viewBox: "0 0 16 16", fill: "#999", class: "img" }, svg("path", { d: "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" }))
        this.username = el("div", username)
        this.storyIcon = svg("svg", { viewBox: "0 0 16 16", fill: "#999", class: "img" }, [
            svg("path", { d: "M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z" }),
            svg("path", { d: "M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" })
        ])
        this.storyTitle = el("div", title)
        this.el = el("div.header", [
            this.userIcon,
            this.username,
            this.storyIcon,
            this.storyTitle
        ])
        mount(parent, this.el)
    }

}
