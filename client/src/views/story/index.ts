import { el, mount } from "redom"
import { Story } from "../../model"
import { Tree, defaultConfig } from "fabletree"
import { StoryTitle } from "../../components/inputs"
import "./story.css"

import { Component } from "../../components"
import { StoryEvents } from "../../model/story"

export class StoryView implements Component {
    el: HTMLElement
    windows: HTMLElement[] = [];
    tree: Tree | null = null;

    constructor(props: {
        story: Story
        events: StoryEvents
    }) {
        console.log(props.story.header)
        this.el = el(".page")
        this.windows.push(el("div", {
            style: {
                width: "100%",
                height: "100vh",
            }
        }))

        if (props.events.onTitleChange === undefined) {
            props.events.onTitleChange = (newTitle: string) => {}
        } 

        mount(this.el, this.windows[0])
        mount(this.el, new StoryTitle({
            title: props.story.header.title,
            onTitleChange: props.events.onTitleChange
        }))


        setTimeout(() => {
            this.tree = new Tree(this.windows[0], defaultConfig(), props.story.nodes)
        }, 100)
    }
} 

