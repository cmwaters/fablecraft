import { RedomComponent, el } from "redom"
import { CenteredPanel, NewUserPanel } from "../../components/panel"
import { NewStoryInput } from "../../components/inputs"
import "./setup.css"

import { Component } from "../../components"

export const StartView = (props: {
    startButton: Component
}): Component => {

    return { 
        el: el("div.page", [
            el("div.centerPanel", [
                el("div.pretitle", "Welcome to"),
                el("div.title", "Fablecraft"),
                el("div", props.startButton, {
                    style: { 
                        margin: "auto",
                        display: "inline-block"
                    }
                } )
                
            ])
        ]),

        onkeydown(key: string): void {
            if (props.startButton.onkeydown) {
                props.startButton.onkeydown(key)
            }
        }
    }
}

export const NewUserView = (props: {
    execute: (username: string) => void
}): Component => {
    let panel = NewUserPanel({
        width: 520,
        height: 220,
        execute: props.execute
    })

    return { 
        el: el("div.page", panel),

        onkeydown: (key: string) => {
            if (panel.onkeydown) {
                panel.onkeydown(key)
            }
        }
    }
}

export const CreateFirstStoryView = (props: {
    callback: (name: string, description: string) => void
}): RedomComponent => {
    return { 
        el: el("div.page", [
            CenteredPanel({
                width: 520,
                height: 220,
                content: new NewStoryInput({
                    execute: props.callback
                }),
                padding: 40
            })
        ])
    }
}
