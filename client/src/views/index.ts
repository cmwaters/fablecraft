import { StartView, CreateFirstStoryView } from "./setup"
import { StoryView } from "./story"
import { StartWritingButton } from "../components/buttons"
import { Component } from "../components"
import { Story, StoryEvents } from "../model"
import { mount, unmount, el } from "redom"
import { notifier } from "./notifier"
import { Tree, defaultConfig } from "fabletree"
import "./view.css"

export { notifier }

export const view = {

    current: null as Component | null,

    init: () => {
        // set up key event listeners
        document.onkeydown = (e: KeyboardEvent) => {
            if (view.current && view.current.onkeydown) {
                view.current.onkeydown(e.key)
            }
        }

        document.onkeyup = (e: KeyboardEvent) => {
            if (view.current && view.current.onkeyup) {
                view.current.onkeyup(e.key)
            }
        }

        view.enableNotifications()
    },

    startPage: (callback: (title: string, description: string) => void) => {
        view.change(StartView({
            startButton: StartWritingButton({
                execute: () => view.change(CreateFirstStoryView({
                    callback: callback,
                }))
            })
        }))
    },

    storyPage: (props: {
        story: Story
        events: StoryEvents
    }) => {
        view.change(new StoryView(props))
    },

    change: (page: Component) => {
        if (view.current) {
            unmount(document.body, view.current)
        }
        mount(document.body, page)
        view.current = page
    },

    enableNotifications: () => {
        mount(document.body, notifier.el)
    },

    disableNotifications: () => {
        unmount(document.body, notifier.el)
    }

}