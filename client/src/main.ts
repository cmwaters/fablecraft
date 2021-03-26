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
    user: undefined as Header | undefined,

    init: async () => {
        // set up view by setting event listeners and enabling notifications
        view.init()

        // set notifier to also print to console (DEBUG MODE)
        notifier.outputAlsoToConsole()

        // attempt to load any existing state
        let success = await app.initializeState()

        if (success) {
            app.loadLastEditedStory()
        } else {
            // we need to create and save a new user and then load the user page
            app.createUser()
        }
    },

    initializeState: async ():Promise<boolean> => {
        try {
            let stories = await app.model.listStories()
            if (stories.length > 0) {
                if (stories[0].uid !== 0) {
                    notifier.error("Error: unable to find user")
                } else {
                    app.user = stories.shift()!
                    app.library = stories
                }
                return true
            } else {
                return false
            }
        } catch (err) {
            notifier.error(err)
            return false
        }
    },

    loadLastEditedStory() {
        let last = app.mostRecentStory()
        if (last.uid === 0) {
            app.loadUserPage()
        } else {
            app.loadStory(last)
        }
    },

    loadUserPage: () => {
        app.model.loadStory(0).then((story: Story | null) => {
            if (story) {
                view.userPage({ 
                    story: story,
                    events: app.eventHandler,
                })
            }
        }).catch((err) => notifier.error(err))
    },

    loadStory: async (header: Header) => {
        await app.model.loadStory(header.uid).then((story: Story | null) => {
            if (story) {
                app.story = story
                view.storyPage({
                    story: story,
                    events: app.eventHandler,
                    home: app.loadUserPage,
                })
            } else {
                throw new Error("unable to find story " + header.title)
            }
        }).catch((err) => {
            notifier.error(err)
        })
    },

    createUser: async () => {
        view.startPage((username: string): void => {
            app.newStory(username, "description").then((story: Story) => {
                app.story = story
                app.user = story.header
                notifier.info("Welcome to Fablecraft")
                view.userPage({
                    story: story,
                    events: app.eventHandler,
                })
            }).catch((err) => {
                notifier.error(err)
            })
        })
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
            notifier.error(err)
            return Promise.reject(err)
        }
    },

    mostRecentStory(): Header {
        let mostRecent = app.user!
        for (let i = 0; i < app.library.length; i++) {
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
