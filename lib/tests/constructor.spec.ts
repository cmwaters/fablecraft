import chai from 'chai'
import { Tree } from "../src/tree"
import { defaultConfig } from "../src/config"
let expect = chai.expect

let container: HTMLElement

describe("Fable Tree | Constructor", () => {
    before(() => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null 
        container = div!
    })

    afterEach(() => {
        // clear the contents after ever test
        container.innerHTML = ""
    })

    it("works", () => {
        expect(true).to.equal(true)
    })
    it("can create a tree", () => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null
        let tree = new Tree(div!, defaultConfig())
        expect(div!.children.length).to.equal(1) 
    })
})
