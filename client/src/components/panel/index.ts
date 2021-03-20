import { RedomComponent, el } from "redom";
import "./panel.css"

export const CenteredPanel = (props: {
    width: number,
    height: number,
    content: RedomComponent
    padding: number,
}): RedomComponent => {
    return { 
        el: el("div.panel", props.content, {
            style: { 
                width: props.width,
                height: props.height,
                padding: props.padding,
                marginTop: "calc(50vh - " + (props.height/2 + props.padding) + "px)", // padding is 50px
            }
        })
    }
}