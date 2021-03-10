import { RedomComponent, el } from 'redom'
import { BorderedButton } from '../buttons'
import { FileTextFillIcon, EaselFillIcon } from "../icons"
import "./input.css"

export const NewStoryInput = (props: {
    callback: (name: string, description: string) => void
}): RedomComponent => {

    return { 
        el: el("div.newStory", [
            el("div", "New Story", {
                style: { 
                    textAlign: "left",
                    fontFamily: "Open Sans",
                    fontSize: 12,
                    marginLeft: 10,
                    marginBottom: -10,
                    color: "#666",
                }
            }),
            InputWithIcon({
                font: "Playfair Display",
                size: 32,
                icon: EaselFillIcon,
                placeholder: "Story",
                autofocus: true
            }),
            TextAreaWithIcon({
                font: "Open Sans",
                size: 16,
                rows: 2,
                icon: FileTextFillIcon,
                placeholder: "Description"
            }),
            el("div", [
                BorderedButton({
                    callback: () => {
                        props.callback("Hello", "World")
                    },
                    text: "Create",
                    color: "#333"
                })
            ], { 
                style: { 
                    width: 100,
                    float: "right",
                }
            })
        ]),

        update: (data: any) => {

        }
    }
}


export const InputWithIcon = (props: {
    font: string,
    size: number,
    icon: SVGElement,
    placeholder: string
    autofocus?: boolean
}): RedomComponent => {
    return { 
        el: el("div.inputWithIcon", [
            props.icon,
            el("input", {
                placeholder: props.placeholder,
                style: {
                    fontFamily: props.font,
                    fontSize: props.size
                },
                autofocus: props.autofocus
            })
        ])
    }
}

export const TextAreaWithIcon = (props: {
    font: string,
    size: number,
    rows: number,
    icon: SVGElement,
    placeholder: string,
    autofocus?: boolean,
}): RedomComponent => {
    return { 
        el: el("div.textAreaWithIcon", [
            props.icon,
            el("textarea", {
                placeholder: props.placeholder,
                style: {
                    fontFamily: props.font,
                    fontSize: props.size
                },
                rows: props.rows,
                autofocus: props.autofocus
            })
        ])
    }
}
