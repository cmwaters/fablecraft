import chai, { assert } from 'chai'
import { Tree } from "../src/tree"
import { defaultConfig } from "../src/config"
import { Pos } from "../src/pos"
import {
    TreeTypology,
    assertTypology,
    getNodeAsElement,
} from "./helper"
let expect = chai.expect

let container: HTMLElement

describe("Fable Tree | Deletion", () => {

    before(() => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null
        container = div!
        container.innerHTML = ""
    })

    afterEach(() => {
        // clear the contents after ever test
        container.innerHTML = ""
    })

    it("can delete a single node", () => {
        let tree = new Tree(container, defaultConfig(), new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes())
        let pos = new Pos(1, 2, 1)
        
        tree.deleteNode(pos)

        assertTypology(tree.el, new TreeTypology([5]).pillar([0, 1, 1, 3, 4]))
    })

    it("can delete node with family", () => {
        let tree = new Tree(container, defaultConfig(), new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes())
        // delete the third card in the first pillar (this has 3 children)
        let pos = new Pos(0, 0, 3)

        tree.deleteNode(pos)

        console.log(tree.string())
        assertTypology(tree.el, new TreeTypology([4]).pillar([0, 1, 2, 4]))
    })


})