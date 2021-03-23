// import { View } from './view'
import { LocalStorage } from './model/local'
import localforage from "localforage"
import { Model, Header, Story } from './model'
import { view, notifier } from './views'
import { Tree, Pos, Node } from "fabletree"
import Delta from "quill-delta"

const app = {
    model: new LocalStorage() as Model,
    library: [] as Header[],
    story: undefined as Story | undefined,

    init: async () => {
        view.init()
        notifier.outputAlsoToConsole()

        try {
            app.library = await app.model.listStories()
        } catch (err) {
            notifier.error(err.toString())
        }

        if (app.library.length === 0) {
            view.startPage((title: string, description: string): void => {
                app.createUser().then(() => {
                    app.newStory(title, description).then((story: Story) => {
                        app.story = story
                        notifier.info("Welcome to Fablecraft")
                        view.storyPage({
                            story: story,
                            events: app.eventHandler,
                            home: app.home
                        })
                    }).catch((err) => {
                        notifier.error(err.toString())
                    })
                }).catch((err) => {notifier.error(err.toString())})
                
            })
        } else {
            // load the most recent story
            let lastStory = app.mostRecentStory()
            await app.model.loadStory(lastStory.uid).then((story: Story | null) => {
                if (story) {
                    app.story = story
                    view.storyPage({ 
                        story: story,
                        events: app.eventHandler,
                        home: app.home,
                    })
                } else {
                    throw new Error("unable to find story " + lastStory.title)
                }
            }).catch((err) => { 
                notifier.error(err.toString()) 
            })
        }
    },

    home: () => {
        console.log("going to the home page")
        app.model.loadStory(0).then((story: Story | null) => {
            if (story) {
                view.libraryPage({ 
                    story: story,
                    events: app.eventHandler.nodes,
                })
            }
        })
    },

    createUser: async () => {
        await app.newStory("user", "").catch(err => { notifier.error(err) })
    },

    newStory: async (title: string, description: string): Promise<Story> => {
        console.log("creating new story " + title)
        try {
            let story = await app.model.createStory({
                uid: app.library.length,
                title: title,
                description: description,
                stateHeight: 0,
                latestHeight: 0,
                lastUpdated: 0,
            })
            app.library.push(story.header)
            return story
        } catch (err) {
            notifier.error(err.toString())
            return Promise.reject(err)
        }
    },

    mostRecentStory(): Header {
        let mostRecent = app.library[0]
        for (let i = 1; i < app.library.length; i++) {
            if (app.library[i].lastUpdated > mostRecent.lastUpdated) {
                mostRecent = app.library[i]
            }
        }
        return mostRecent
    },

    eventHandler: {
        onTitleChange: (newTitle: string) => {
            if (app.story) {
                app.story.header.title = newTitle
                app.model.editStory(app.story.header)
            }
        },
        nodes: {
            onNewNode: (uid: number, pos: Pos) => {
                console.log("new node event triggered")
                if (app.story) {
                    app.model.newNode({
                        uid: uid,
                        pos: pos,
                        content: new Delta(),
                    })
                }
            },
            onMoveNode: (uid: number, oldPos: Pos, newPos: Pos) => {
                console.log("move node event triggered")
                if (app.story) {
                    app.model.moveNode(uid, newPos)
                }
            },
            onModifyNode: (uid: number, delta: Delta) => {
                console.log("modify node event triggered")
                if (app.story) {
                    app.model.modifyNode(uid, delta)
                }
            },
            onDeleteNode: (node: Node) => {
                console.log("delete node event triggered")
                if (app.story) {
                    app.model.deleteNode(node.uid)
                }
            },
        }
    },

}

window.onload = async () => {
    console.log("Starting fablecraft")

    await app.init()
}
