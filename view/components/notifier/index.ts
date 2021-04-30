import { Notification } from "../notifications"
import { el, mount, unmount } from "redom"
import config from "../../../config.json"
import "./notifier.css"

const INFO_COLOR = "white"
const WARNING_COLOR = "#ffbc49"
const ERROR_COLOR = "#f76060"

export const notifier = {
    notifications: [] as Notification[],
    consoleOutput: false,
    el: el("div.notifier"),

    info(header: Error | string, subtext?: string, pointer?: () => void) {
        this.create(header, INFO_COLOR, subtext, pointer)
    },

    warning(header: Error | string, subtext?: string, pointer?: () => void) {
        this.create(header, WARNING_COLOR, subtext, pointer)
    },

    error(header: Error | string, subtext?: string, pointer?: () => void) {
        this.create(header, ERROR_COLOR, subtext, pointer)
    },

    create(header: Error | string, color: string, subtext?: string, pointer?: () => void) {
        if (notifier.consoleOutput) {
            if (color === ERROR_COLOR) {
                console.error(header)
            } else {
                console.log(header)
            }
        }
        if (typeof header !== "string") {
            header = header.toString()
        }
        let notification = new Notification(header, color, subtext, pointer)
        notifier.notifications.push(notification);
        notification.el.onmouseleave = () => {
            setTimeout(() => {
                unmount(notifier.el, notification.el)
            }, 300)
        }
        setTimeout(() => {
            unmount(notifier.el, notification.el)
        }, config.notifier.displayTimeMS)
        mount(notifier.el, notification.el)
        
    },

    outputAlsoToConsole() {
        notifier.consoleOutput = true
    }

}