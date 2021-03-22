import { expect } from "chai"
import localforage from "localforage"
import { LocalStorage } from "../src/model/local"
import { Pos } from "fabletree"
import Delta from "quill-delta"
import { 
    expectEqualNodes, 
    expectEqualStories,
    expectEqualHeaders,
    expectStateSize,
    expectHistorySize,
    printNodes,
 } from "./utils"
 import { errors } from "../src/model"

const defaultStoryHeader = {
    uid: 0,
    title: "Test Story",
    description: "This is a test story",
    stateHeight: 0,
    latestHeight: 0,
    lastUpdated: 0,
}

// NOTE: all tests are linked. Please be careful when using it.only
describe("Model | LocalStorage", () => {
    const db = new LocalStorage()

    after(() => {
        localforage.clear()
    })


    it("can save and load a new story", async () => {

        let story = await db.createStory(defaultStoryHeader)

        expect(story.nodes.length).to.equal(1)
        expectEqualNodes(story.nodes[0], { 
            uid: 0,
            pos: new Pos(),
            content: new Delta()
        })

        await expectStateSize(0, 1)

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
            lastUpdated: 0
        }

        let differentStory = await db.createStory(differentHeader)

        await expectStateSize(1, 1)

        let loadedStory = await db.loadStory(differentHeader.uid)
        expect(loadedStory).to.not.be.null
        if (loadedStory) {
            expect(loadedStory.nodes.length).to.equal(1)
            expectEqualStories(loadedStory!, differentStory)
        }

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
            expect(story.nodes.length).to.equal(2, "amount of nodes in story")
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
            await expectHistorySize(0, 2)
        }

    })

    it("can move a node", async () => {
        await db.moveNode(0, new Pos(0, 0, 1))
        await db.moveNode(1, new Pos())

        let story = await db.loadStory(defaultStoryHeader.uid)
        expect(story).to.not.be.null
        if (story) {
            expect(story.nodes.length).to.equal(2, printNodes(story.nodes))
            expectEqualNodes(story.nodes[0], { 
                uid: 0,
                pos: new Pos(0, 0, 1), 
                content: new Delta().insert("Fable")
            })
            expectEqualNodes(story.nodes[1], {
                uid: 1,
                pos: new Pos(),
                content: new Delta().insert("Hello")
            })
            expect(story.header.latestHeight).to.equal(4)
            expect(story.header.stateHeight).to.equal(4)
            await expectHistorySize(0, 4)
        }
    })

    it("can delete a node", async () => {
        await db.deleteNode(1)

        let story = await db.loadStory(defaultStoryHeader.uid)
        expect(story).to.not.be.null
        if (story) {
            expect(story.nodes.length).to.equal(1, "amount of nodes")
            expect(story.nodes[0].uid).to.equal(0, "first node id")
            expect(story.header.latestHeight).to.equal(5)
            expect(story.header.stateHeight).to.equal(5)
        }
    })

    it("can perform multiple operations to a single story", async () => {
        await db.newNode({
            uid: 1,
            pos: new Pos(1, 0, 0), 
            content: new Delta().insert("Hello")
        })

        await db.modifyNode(1, new Delta().retain(5).insert(" World"))

        await db.newNode({ 
            uid: 2,
            pos: new Pos(1, 0, 1), 
            content: new Delta().insert("This is Fablecraft")
        })

        await db.moveNode(2, new Pos())

        await db.deleteNode(0)

        let story = await db.loadStory(defaultStoryHeader.uid)
        expect(story).to.not.be.null
        if (story) {
            expect(story.nodes.length).to.equal(2, "amount of nodes in story")
            console.log(story.nodes[0].content)
            expectEqualNodes(story.nodes[0], { 
                uid: 1,
                pos: new Pos(1, 0, 0),
                content: new Delta().insert("Hello World")
            })
            expectEqualNodes(story.nodes[1], {
                uid: 2,
                pos: new Pos(),
                content: new Delta().insert("This is Fablecraft")
            })
            await expectHistorySize(0, 10)
        }
    })

    it("can edit a story's title", async () => {
        let changedHeader = {
            uid: 1,
            title: "A new story",
            description: "",
            // these values should be ignored
            stateHeight: 100, 
            latestHeight: 100,
            lastUpdated: 0
        }

        let returnedHeader = await db.editStory(changedHeader)

        expect(returnedHeader.title).to.equal(changedHeader.title)
        expect(returnedHeader.description).to.equal(changedHeader.description)
        expect(returnedHeader.stateHeight).to.not.equal(changedHeader.stateHeight)
        expect(returnedHeader.latestHeight).to.not.equal(changedHeader.latestHeight)
    })

    it("can not edit a story that doesn't exist", async () => {
        let changedHeader = {
            uid: 2,
            title: "A new story",
            description: "",
            stateHeight: 0,
            latestHeight: 0,
            lastUpdated: 0,
        }

        try {
            await db.editStory(changedHeader)
        } catch (err) {
            expect(err.message).to.equal(errors.storyNotFound(changedHeader.uid))
        }
    })

    it("can delete a story", async () => {
        await db.deleteStory(1)

        await expectStateSize(1, 0)
        await expectHistorySize(1, 0)

        let stories = await db.listStories()
        expect(stories.length).to.equal(1)
        expect(stories[0].uid).to.equal(0)        
    })

    it("throws an error when a story is not locked", async () => {
        try {
            db.newNode({ 
                uid: 1,
                pos: new Pos(0, 0, 1),
                content: new Delta().insert("Hello")
            })
        } catch(err) {
            expect(err).to.equal(errors.noStoryLocked)
        }

        try {
            db.moveNode(1, new Pos())
        } catch (err) {
            expect(err).to.equal(errors.noStoryLocked)
        }

        try {
            db.modifyNode(1, new Delta().insert("test"))
        } catch (err) {
            expect(err).to.equal(errors.noStoryLocked)
        }

        try {
            db.deleteNode(2)
        } catch (err) {
            expect(err).to.equal(errors.noStoryLocked)
        }
            
    })

})