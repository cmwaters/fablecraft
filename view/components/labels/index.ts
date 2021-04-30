import { el } from "redom"
import { Component } from ".."
import { PersonFillIcon } from "../icons"


export const LabelWithIcon = (props: { 
    text: string,
    icon: SVGElement
    style?: { [key: string]: any }
}): Component => {
    return { 
        el: el("div.label", [
            props.icon,
            el("span", props.text)
        ], { 
            style: props.style
        })
    }
}
