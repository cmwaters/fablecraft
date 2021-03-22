import { RedomComponent, el, place } from 'redom'
import { Component } from "../"
import { BorderedButton } from '../buttons'
import { FileTextFillIcon, EaselFillIcon } from "../icons"
import "./input.css"

export class NewStoryInput implements Component {
    el: HTMLElement

    constructor(props: {
        execute: (name: string, description: string) => void
        }) {

        let label = el("div", "New Story", {
            style: {
                textAlign: "left",
                fontFamily: "Open Sans",
                fontSize: 12,
                marginLeft: 10,
                marginBottom: - 10,
                color: "#666",
            }
        })

        let storyTitle = new InputWithIcon({
            style: {
                fontFamily: "Playfair Display",
                fontSize: 32,
            },
            icon: EaselFillIcon,
            placeholder: "Story Title",
            autofocus: true
        })

        let storyDescription = new TextAreaWithIcon({
            font: "Open Sans",
            size: 16,
            rows: 2,
            icon: FileTextFillIcon({}),
            placeholder: "Description"
        })

        let createButton = new BorderedButton({
            execute: () => {
                props.execute(
                    storyTitle.input.value, 
                    storyDescription.textArea.value
                )
            },
            text: "Create",
            backgroundColor: {
                normal: "#333",
                disabled: "#999", 
                active: "#157bef"
            }
        })

        createButton.disable()

        storyTitle.input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                if (storyTitle.input.value.length != 0) {
                    setTimeout(() => {
                        storyDescription.textArea.placeholder = "Add a Description or Press Enter to Skip"
                        storyDescription.textArea.focus()
                    }, 100)
                }
            }
            setTimeout(() => {
                if (storyTitle.input.value.length != 0) {
                    createButton.enable()
                } else {
                    createButton.disable()
                }
            }, 100)
        })

        storyDescription.textArea.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === "Tab") {
                e.stopImmediatePropagation()
                setTimeout(() => {
                    createButton.el.focus()
                })
            }
        })


        this.el = el("div.newStory", [
            label,
            storyTitle,
            storyDescription,
            el("div", createButton, {
                style: {
                    float: "right",
                }
            })
        ])

    } 
}

export class StoryTitle implements RedomComponent {
    el: HTMLElement
    input: HTMLInputElement

    constructor(props: {
        title: string,
        onTitleChange?: (newTitle: string) => void,
    }) {
        let inputComponent = new InputWithIcon({
            icon: FileTextFillIcon({
                style: {
                    fill: "#7c848c",
                    width: 20,
                }
            }),
            value: props.title,
            style: {
                fontFamily: "Open Sans",
                fontSize: 12,
                margin: 5,
                color: "#7c848c",
                paddingBottom: 2,
            },
        })

        this.el = el("div.storyTitle", [
            inputComponent
        ])

        this.input = inputComponent.input

        this.input.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && this.input.value.length > 0) {
                if (props.onTitleChange) {
                    props.onTitleChange(this.input.value)
                }
            }
        }
    }
}


export class InputWithIcon implements RedomComponent {
    
    input: HTMLInputElement
    el: HTMLElement
    icon: SVGElement

    
    constructor(props: {
        icon: SVGElement,
        value?: string
        placeholder?: string
        autofocus?: boolean
        style?: { [key: string]: any } 
        }) {
        console.log("style")
        console.log(props.style)
        console.log(props.autofocus)
        this.icon = props.icon
        this.input = el("input", {
            value: props.value !== undefined ? props.value : "",
            placeholder: props.placeholder !== undefined ? props.placeholder: "",
            autofocus: props.autofocus,
            style: props.style,
        })

        this.el = el("div.inputWithIcon", [
            this.icon,
            this.input,
        ], { style: props.style })
    }
}

export class TextAreaWithIcon implements RedomComponent {
    icon: SVGElement
    textArea: HTMLTextAreaElement
    el: HTMLElement

    constructor(props: {
        font: string,
        size: number,
        rows: number,
        icon: SVGElement,
        placeholder: string,
        autofocus?: boolean,
    }) {
        this.icon = props.icon
        this.textArea = el("textarea", {
            placeholder: props.placeholder,
            style: {
                fontFamily: props.font,
                fontSize: props.size
            },
            rows: props.rows,
            autofocus: props.autofocus
        })
        this.el = el("div.textAreaWithIcon", [
            this.icon,
            this.textArea,
        ])
    }
}


