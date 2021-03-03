import chai, { assert } from 'chai'
import { Tree } from "../src/tree"
import { defaultConfig } from "../src/config"
import { Pos } from "../src/node"
import {
    TreeTypology,
    assertTypology,
    getNodeAsElement,
} from "./helper"
let expect = chai.expect

let container: HTMLElement
let tree: Tree

describe("Fable Tree | Movement", () => {
    before(() => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null
        container = div!
        container.innerHTML = ""
        expect(container.children.length).to.equal(0)
        tree = new Tree(container, defaultConfig())
    })

    afterEach(() => {
        // clear the contents after ever test
        container.innerHTML = ""
    })

    it("can create a tree", () => {
        expect(tree.el).to.equal(container)
        assertTypology(tree.el, new TreeTypology([1])) // a single pillar with a single card
        let nodeEl = getNodeAsElement(tree.el, new Pos()) // get the first card
        let node = tree.getNode(new Pos())
        expect(nodeEl).to.equal(node.el)
        expect(node.editor.getText()).to.equal("Welcome to Fablecraft\n")
    })
})


