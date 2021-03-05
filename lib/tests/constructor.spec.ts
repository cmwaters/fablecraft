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

describe("Fable Tree | Constructor", () => {
    before(() => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null 
        container = div!
        container.innerHTML = ""
    })

    afterEach(() => {
        // clear the contents after every test
        container.innerHTML = ""
    })

    it("can create a blank tree", () => {
        let tree = new Tree(container, defaultConfig())
        expect(tree.el).to.equal(container)
        assertTypology(tree.el, new TreeTypology([1])) // a single pillar with a single card
        let nodeEl = getNodeAsElement(tree.el, new Pos()) // get the first card
        let node = tree.getNode(new Pos())
        expect(nodeEl).to.equal(node.el)
        expect(node.editor.getText()).to.equal("Welcome to Fablecraft\n")
        // expect(node.hasFocus()).to.be.true
    })


    it("can create a tree from existing nodes", () => {
        let typology = new TreeTypology([5]).pillar([0, 3, 0, 4, 1])
        let nodes = typology.nodes()
        let tree = new Tree(container, defaultConfig(), nodes)
        assertTypology(tree.el, typology)
    })

})
