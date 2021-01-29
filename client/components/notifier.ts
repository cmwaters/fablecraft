import { RedomComponent, el, mount, unmount, s } from "redom";
import { ViewComponent } from "./view_component";
import * as config from "../config.json"

const INFO_COLOR = "white"
const WARNING_COLOR = "#ffbc49"
const ERROR_COLOR = "#f76060"

export class Notifications implements RedomComponent {
    notifications: Notification[] = []; 
    el: HTMLElement

    constructor(parent: HTMLElement) {
        this.el = el("div.notifier")
        mount(parent, this.el)
    }

    info(header: string, subtext?: string, pointer?: () => void) {
        this.create(header, INFO_COLOR, subtext, pointer)
    }

    warning(header: string, subtext?: string, pointer?: () => void) {
        this.create(header, WARNING_COLOR, subtext, pointer)
    }

    error(header: string, subtext?: string, pointer?: () => void) {
        this.create(header, ERROR_COLOR, subtext, pointer)
    }

    create(header: string, color: string, subtext?: string, pointer?: () => void,) {
        let notification = new Notification(header, color, subtext, pointer)
        this.notifications.push(notification);
        notification.el.onmouseleave = () => {
            setTimeout(() => {
                unmount(this.el, notification.el)
            }, 300)
        }
        setTimeout(() => {
            unmount(this.el, notification.el)
        }, config.notifier.displayTimeMS)
        mount(this.el, notification.el)
    }

}

export class Notification implements RedomComponent {
    el: HTMLElement

    constructor(header: string, color: string, subtext?: string, pointer?: () => void) {
        this.el = el("div.notification", [
            el("h1", header),
        ])
        if (subtext) {
            this.el.appendChild(el("p", subtext))
        }
        this.el.style.backgroundColor = color
        if (pointer) {
            this.el.onclick = pointer
        }
    }

}