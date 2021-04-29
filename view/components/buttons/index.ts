import { key } from "localforage"
import { RedomComponent, el, svg } from "redom"
import { Component } from ".."
import { PenFillIcon } from "../icons"
import "./button.css"

export type ButtonState = {
    disabled: string
    active: string,
    normal: string
}

export interface ButtonComponent extends Component {
    click(): void 
    enable(): void
    disable(): void
}

export class ButtonWithIcon implements ButtonComponent {
    el: HTMLElement
    button: HTMLButtonElement
    icon: SVGElement
    click: () => void
    onkeydown: (key: string) => void = (key: string) => {}
    onkeyup: (key: string) => void = (key: string) => {}


    constructor(props: {
        execute: () => void,
        icon: SVGElement
        text: string,
        style?: { [key: string]: any } 
        }) {

        this.click = () => {
            if (!this.button.disabled) {
                props.execute()
            }
        }
        this.icon = props.icon
        this.button = el("button", props.text, {
            style: props.style
        })
        this.el = el("div.buttonWithIcon", [
            this.icon,
            this.button
        ], {
            onclick: this.click
        })
    }

    enable() {
        this.button.disabled = false;
    }

    disable() {
        this.button.disabled = true;
    }
}

export const StartWritingButton = (props: {
    execute: () => void
}): ButtonComponent => {
    let button = new ButtonWithIcon({
        icon: PenFillIcon({}),
        text: "Press Any Key to Start Writing",
        execute: props.execute,
    })
    
    button.onkeydown = (key: string) => {
        button.click()
    }

    return button
}

export class BorderedButton implements ButtonComponent {
    el: HTMLButtonElement
    click: () => void
    backgroundColor: ButtonState

    constructor(props: {
        execute: () => void,
        text: string,
        backgroundColor: {
            normal: string,
            disabled: string,
            active: string,
        },
    }) {
        this.click = () => {
            if (!this.el.disabled) {
                props.execute()
            }
        } 

        this.backgroundColor = props.backgroundColor 
            
        this.el = el("button", props.text, {
            class: "borderedButton",
            style: {
                backgroundColor: this.backgroundColor.normal
            },
            onclick: () => {
                this.click()
            }
        })

        this.el.addEventListener("focus", (e: FocusEvent) => {
            this.el.style.backgroundColor = this.backgroundColor.active
        })

        this.el.addEventListener("blur", (e: FocusEvent) => {
            this.el.style.backgroundColor = this.backgroundColor.normal
        })
    }

    enable() {
        this.el.disabled = false
        this.el.style.backgroundColor = this.backgroundColor.normal
    }

    disable() {
        this.el.disabled = true
        this.el.style.backgroundColor = this.backgroundColor.disabled
    }
}

export class IconButton implements ButtonComponent {
    el: HTMLButtonElement
    icon: SVGElement
    click: () => void

    constructor(props: {
        execute: () => void,
        icon: SVGElement
        width: number,
    }) {
        this.click = () => {
            if (!this.el.disabled) {
                props.execute()
            }
        }

        this.icon = props.icon

        this.el = el("button", this.icon, {
            class: "iconButton",
            style: {
                width: props.width,
            },
            onclick: () => {
                this.click()
            }
        })

        // this.el.addEventListener("focus", (e: FocusEvent) => {
        //     this.el.style.backgroundColor = this.backgroundColor.active
        // })

        // this.el.addEventListener("blur", (e: FocusEvent) => {
        //     this.el.style.backgroundColor = this.backgroundColor.normal
        // })
    }

    enable() {
        this.el.disabled = false
        // this.el.style.backgroundColor = this.backgroundColor.normal
    }

    disable() {
        this.el.disabled = true
        // this.el.style.backgroundColor = this.backgroundColor.disabled
    }
}
