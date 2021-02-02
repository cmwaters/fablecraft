import { Controller } from "./controller";
import { Model } from "./model"
import { View } from "./view"
import { Client } from './client'

window.onload = async () => {
    let view = new View()
    let model = new Model(view)
    let controller = new Controller(view, model)

    // check if the user is already logged in (prior session is saved and still valid)
    let user = await Client.getUserProfile()
    if (!user) {
        // if not require the user to login (the user can also switch to signup)
        user = await controller.login()
    }

    // load either the most recent story in the db, the first available one
    // in the db, or if there is either none or in incognito mode, create a new story.
    let { story, cards } = await controller.loadStory(user)

    // init the model and load the view of the story
    await controller.model.init(user, story, cards)

    // set up the cli
    controller.setup.cli()

    // focus on the default window
    controller.defaultContext = view.window
    controller.focus()
};
