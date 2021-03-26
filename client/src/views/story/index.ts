import { el, mount } from "redom"
import { Story } from "../../model"
import { Tree, defaultConfig, Events } from "fabletree"
import "./story.css"
import { notifier } from "../"

import { Component } from "../../components"

export class StoryView implements Component {
    el: HTMLElement
    windows: HTMLElement[] = [];
    tree: Tree | null = null;

    constructor(props: {
        story: Story
        events: Events,
    }) {
        console.log(props.story.header)
        console.log(props.story.nodes)
        this.el = el(".page")
        this.windows.push(el("div", {
            style: {
                width: "100%",
                height: "100vh",
            }
        }))

        mount(this.el, this.windows[0])


        setTimeout(() => {
            try {
                this.tree = new Tree(this.windows[0], defaultConfig(), props.story.nodes, {
                    events: props.events
                })
            } catch (err) {
                notifier.error(err.toString())
            }
        }, 100)
    }

    split() {

    }
} 

