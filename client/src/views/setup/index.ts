import { RedomComponent, el } from "redom"
import { CenteredPanel } from "../../components/panel"
import { NewStoryInput } from "../../components/inputs"
import "./setup.css"

import { Component } from "../../contexts/component"

export const startView = (props: {
    startButton: Component
}): Component => {

    return { 
        el: el("div.startView", [
            el("div.centerPanel", [
                el("div.pretitle", "Welcome to"),
                el("div.title", "Fablecraft"),
                props.startButton,
            ])
        ]),

        onkeydown(key: string): void {
            if (props.startButton.onkeydown) {
                props.startButton.onkeydown(key)
            }
        }
    }
}

export const BlankView = (props: {
    content: Component
}): RedomComponent => {
    return {
        el: el("div.blankView", props.content)
    }
}

export const CreateFirstStoryView = (props: {
    callback: (name: string, description: string) => void
}): RedomComponent => {
    return { 
        el: BlankView({
            content: CenteredPanel({
                width: 520,
                height: 220,
                content: NewStoryInput({
                    callback: props.callback
                }),
                padding: 40
            })
        })
    }
}
