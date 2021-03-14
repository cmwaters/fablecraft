// import { View } from './view'
import { LocalStorage } from './model/localStorage'
import { Model, Header, Story } from './model'
import { view, notifier } from './views'
import { Tree, Pos } from "fabletree"

const app = {
    model: new LocalStorage() as Model,
    library: [] as Header[],
    story: null as Story | null,
    tree: null as Tree | null,

    events: {
        onTitleChange: (newTitle: string) => {
            if (app.story) {
                app.story.header.title = newTitle
                app.model.editStory(app.story.header)
            }
        },
        nodes: {
            onNewNode: (uid: number, pos: Pos) => {

            }
        }
    },


    init: async () => {
        view.init()
        notifier.outputAlsoToConsole()

        try {
            app.library = await app.model.listStories()
        } catch (err) {
            notifier.error(err)
        }

        if (app.library.length === 0) {
            view.startPage((title: string, description: string): void => {
                app.newStory(title, description).then((story: Story) => {
                    app.story = story
                    view.storyPage({
                        story: story,
                        events: app.events
                    })
                }).catch((err) => {
                    notifier.error(err)
                })
            })
        } else {
            // load the first story
            // TODO: We should load the most recently updated
            app.model.loadStory(app.library[0].uid).then((story: Story | null) => {
                if (story) {
                    app.story = story
                    view.storyPage({ 
                        story: story,
                        events: app.events,
                    })
                } else {
                    notifier.error("unable to find story")
                }
            }).catch((err) => { notifier.error(err) })
        }
    },

    newStory: async (title: string, description: string): Promise<Story> => {
        console.log("creating new story " + title)
        let story = await app.model.createStory({
            uid: app.library.length,
            title: title,
            description: description
        })
        app.library.push(story.header)
        return story
    }

}

window.onload = async () => {
    console.log("Starting fablecraft")

    await app.init()
}
