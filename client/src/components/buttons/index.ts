import { key } from "localforage"
import { RedomComponent, el, svg } from "redom"
import { Component } from "../../contexts/component"
import { PenFillIcon } from "../icons"
import "./button.css"

export interface ButtonElement extends Component {
    click(): void 
}

export const ButtonWithIcon = (props: {
    icon?: SVGElement
    text: string,
    callback: () => void,
}): ButtonElement => {
    return {
        el: el("div.buttonWithIcon", [
            props.icon,
            el("div", props.text)
        ], {
            onclick: () => {
                props.callback()
            }
        }),

        click() {
            props.callback()
        },

        onkeydown(key: string) {
            if (key === "Enter") {
                props.callback()
            }
        }
    }
}

export const StartWritingButton = (props: {
    callback: () => void
}): ButtonElement => {
    return ButtonWithIcon({
        icon: PenFillIcon,
        text: "Start Writing",
        callback: () => {
            props.callback()
        }
    })
}

export const BorderedButton = (props: {
    callback: () => void,
    text: string,
    color: string
}): ButtonElement => {
    return { 
        el: el("div.borderedButton", props.text, {
            style: {
                padding: 5,
                backgroundColor: props.color
            },
            onclick: () => {
                props.callback()
            }
        }),

        click() {
            props.callback()
        }
    }
}