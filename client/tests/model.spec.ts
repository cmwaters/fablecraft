import { expect } from "chai"
import { LocalStorage } from "../src/model/local"
import { Pos } from "fabletree"
import Delta from "quill-delta"
import { expectEqualNodes, expectEqualStories } from "./utils"


describe("Model | LocalStorage", () => {

    it("passes a sanity check", () => {
        expect(1 + 1).to.equal(2)
    })

    it("can save and load a new story", async () => {
        
        let db = new LocalStorage()

        let storyHeader = {
            uid: 0,
            title: "Test Story",
            description: "This is a test story",
            stateHeight: 0,
            latestHeight: 0,
        }

        let story = await db.createStory(storyHeader)

        expect(story.nodes.length).to.equal(1)
        expectEqualNodes(story.nodes[0], { 
            uid: 0,
            pos: new Pos(),
            content: new Delta()
        })

        let loadedStory = await db.loadStory(storyHeader.uid)
        
        expect(loadedStory).to.not.be.null
        expectEqualStories(loadedStory!, story)

    })

})