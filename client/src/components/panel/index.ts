import { RedomComponent, el } from "redom";
import { Component } from "..";
import { PersonFillIcon } from "../icons"
import "./panel.css"

export const CenteredPanel = (props: {
    width: number,
    height: number,
    content: RedomComponent | HTMLElement
    padding?: number,
    class?: string
}): RedomComponent => {
    let padding = 20
    if (props.padding) {
        padding = props.padding
    }

    let className = "div.panel"
    if (props.class) {
        className = "div." + props.class
    }
 
    return { 
        el: el(className, props.content, {
            style: { 
                width: props.width,
                height: props.height,
                padding: padding,
                marginTop: "calc(50vh - " + (props.height/2 + padding) + "px)", // padding is 50px
            }
        })
    }
}

export const NewUserPanel = (props: {
    width: number,
    height: number,
    execute: (username: string) => void,
}): Component => {

    let iconWidth = props.width / 3
    let padding = (props.height - iconWidth) / 2
    let textWidth = props.width - (iconWidth + 2 * padding)

    let input = el("input", {
        autofocus: true,
        style: {
            textAlign: "center",
            fontSize: 28,
            fontFamily: "Playfair Display",
            width: textWidth,
            float: "right",
        }
    })

    let content = el("div.newUserInternal", [
        PersonFillIcon({
            style: {
                width: iconWidth,
                fill: "#333",
                float: "left",
                padding: padding
            }
        }),
        el("div", "How would you like to be known as?", {
            style: {
                float: "right",
                paddingTop: props.height/4,
                height: props.height/4,
                width: textWidth,
            }
        }),
        input
    ])

    return { 
        el: CenteredPanel({
            width: props.width,
            height: props.height,
            content: content,
            padding: 40,
        }),

        onkeydown: (key: string) => {
            if (key === "Enter") {
                console.log(input.value)
                props.execute(input.value)
            }
        }
    }
}