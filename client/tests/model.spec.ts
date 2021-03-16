import { expect } from "chai"
import { LocalStorage } from "../src/model/local"
import { Pos } from "fabletree"
import Delta from "quill-delta"
import { 
    expectEqualNodes, 
    expectEqualStories,
    expectEqualHeaders,
 } from "./utils"

const defaultStoryHeader = {
    uid: 0,
    title: "Test Story",
    description: "This is a test story",
    stateHeight: 0,
    latestHeight: 0,
}


describe("Model | LocalStorage", () => {
    const db = new LocalStorage()

    it("passes a sanity check", () => {
        expect(1 + 1).to.equal(2)
    })

    it("can save and load a new story", async () => {

        let story = await db.createStory(defaultStoryHeader)

        expect(story.nodes.length).to.equal(1)
        expectEqualNodes(story.nodes[0], { 
            uid: 0,
            pos: new Pos(),
            content: new Delta()
        })

        let loadedStory = await db.loadStory(defaultStoryHeader.uid)
        expect(loadedStory).to.not.be.null
        expectEqualStories(loadedStory!, story)

    })

    it("can create a different story and switch between them", async () => {
        let differentHeader = {
            uid: 1,
            title: "A different story",
            description: "",
            latestHeight: 0,
            stateHeight: 0,
        }

        let differentStory = await db.createStory(differentHeader)

        let loadedStory = await db.loadStory(differentHeader.uid)
        expect(loadedStory).to.not.be.null
        expectEqualStories(loadedStory!, differentStory)

        let originalStory = await db.loadStory(defaultStoryHeader.uid)
        expect(originalStory).to.not.be.null
        expectEqualHeaders(originalStory!.header, defaultStoryHeader)

        let allHeaders = await db.listStories()
        expect(allHeaders.length).to.equal(2)
    })

    it("can save a new node", async () => {

        let newNode = {
            uid: 1,
            pos: new Pos(0, 0, 1),
            content: new Delta().insert("Hello")
        }

        await db.newNode(newNode)

        let story = await db.loadStory(defaultStoryHeader.uid)
        expect(story).to.not.be.null
        if (story) {
            expect(story.nodes.length).to.equal(2)
            expectEqualNodes(story.nodes[1], newNode)
            expect(story.header.latestHeight).to.equal(1)
            expect(story.header.stateHeight).to.equal(1)
        }
    })
    
    it("can modify a node", async () => {
        await db.modifyNode(0, new Delta().insert("Fable"))

        let story = await db.loadStory(defaultStoryHeader.uid)
        expect(story).to.not.be.null
        if (story) {
            console.log(story.nodes[0])
            expectEqualNodes(story.nodes[0], { 
                uid: 0,
                pos: new Pos(),
                content: new Delta().insert("Fable")
            })
            expect(story.header.latestHeight).to.equal(2)
            expect(story.header.stateHeight).to.equal(2)
        }

    })

    // it("can move a node", async () => {
    //     await db.moveNode(0, new Pos(0, 0, 1))
    //     await db.moveNode(1, new Pos())

    //     let story = await db.loadStory(defaultStoryHeader.uid)
    //     expect(story).to.not.be.null
    //     if (story) {
    //         expect(story.nodes.length).to.equal(2)
    //         expectEqualNodes(story.nodes[0], { 
    //             uid: 0,
    //             pos: new Pos(0, 0, 1), 
    //             content: new Delta().insert("Fable")
    //         })
    //         expectEqualNodes(story.nodes[0], {
    //             uid: 1,
    //             pos: new Pos(),
    //             content: new Delta().insert("Hello")
    //         })
    //         expect(story.header.latestHeight).to.equal(2)
    //         expect(story.header.stateHeight).to.equal(2)
    //     }

    // })

})