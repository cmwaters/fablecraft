// import { View } from './view'
import { LocalStorage } from './model/local'
import { Model, Header, Story } from './model'
import { view, notifier } from './views'
import { Tree, Pos, Node } from "fabletree"
import Delta from "quill-delta"

const app = {
    model: new LocalStorage() as Model,
    library: [] as Header[],
    story: null as Story | null,
    tree: null as Tree | null,

    eventHandler: {
        onTitleChange: (newTitle: string) => {
            if (app.story) {
                app.story.header.title = newTitle
                app.model.editStory(app.story.header)
            }
        },
        nodes: {
            onNewNode: (uid: number, pos: Pos) => {
                if (app.story) {
                    app.model.newNode({ 
                        uid: uid, 
                        pos: pos,
                        content: new Delta(),
                    })
                }
            }, 
            onMoveNode: (uid: number, oldPos: Pos, newPos: Pos) => {
                if (app.story) {
                    app.model.moveNode(uid, newPos)
                }
            },
            onModifyNode: (uid: number, delta: Delta) => {
                if (app.story) {
                    app.model.modifyNode(uid, delta)
                }
            },
            onDeleteNode: (node: Node) => {
                if (app.story) {
                    app.model.deleteNode(node.uid)
                }
            },
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
                        events: app.eventHandler
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
                        events: app.eventHandler,
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
            description: description,
            stateHeight: 0,
            latestHeight: 0,
        })
        app.library.push(story.header)
        return story
    }

}

window.onload = async () => {
    console.log("Starting fablecraft")

    await app.init()
}
