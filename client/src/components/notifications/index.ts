import { RedomComponent, el, mount, unmount } from "redom";
import "./notifications.css"

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