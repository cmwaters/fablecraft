// import { View } from './view'
import { LocalStorage } from './model/localStorage'
import { Model } from './model'

import { Header } from './model/header'


import { CenteredPanel } from "./components/panel"
import { StartWritingButton } from "./components/buttons"
import { startView } from "./views/setup"
import config from "../config.json"
import "./views/index.css"
import { el, mount, RedomComponent, unmount, } from 'redom'
import { Tree, defaultConfig } from 'fabletree'
import { CreateFirstStoryView } from "./views/setup"
import { Component } from "./contexts/component"

const app = {
    model: new LocalStorage() as Model,
    stories: [] as Header[],
    view: null as null | Component,
    init: async () => {

        // set up key event listeners
        document.onkeydown = (e: KeyboardEvent) => {
            if (app.view && app.view.onkeydown) {
                app.view.onkeydown(e.key)
            }
        }

        document.onkeyup = (e: KeyboardEvent) => {
            if (app.view && app.view.onkeyup) {
                app.view.onkeyup(e.key)
            }
        }


        try {
            app.stories = await app.model.listStories()
        } catch (err) {
            console.error(err)
        }

        if (app.stories.length === 0) {
            let start = startView({
                startButton: StartWritingButton({
                    callback: () => app.changeView(CreateFirstStoryView({
                        callback: (title: string, description: string) => {
                            app.newStory(title, description)
                        }
                    }))
                })
            })
            app.changeView(start)
        }
    },
    changeView: (newView: Component) => {
        if (app.view) {
            unmount(document.body, app.view)
        }
        mount(document.body, newView)
        app.view = newView
    },

    newStory: (title: string, description: string) => {
        let story = {
            header: {
                uid: app.stories.length,
                title: title,
                description: description
            },
            cards: []
        }

        app.model.createStory(story.header)
        app.stories.push(story.header)
    }

}

window.onload = async () => {
    console.log("Starting fablecraft")

    await app.init()
}
