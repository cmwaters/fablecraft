import chai, { assert } from 'chai'
import { Tree, defaultConfig, Pos } from "../../tree"
import {
    TreeTypology,
    assertTypology,
    getNodeAsElement,
} from "./helper"
let expect = chai.expect

let container: HTMLElement

describe("Tree | Deletion", () => {

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
        assertTypology(tree.el, new TreeTypology([4]).pillar([0, 1, 2, 4]))

        // get the active card - this should be the one above
        let activeCard = tree.getCard()
        expect(activeCard.pos().equals(new Pos(0,0,2))).to.be.true
    })

    it("can delete last node in a pillar", () => {
        let tree = new Tree(container, defaultConfig(), new TreeTypology([2]).pillar([0, 1]).nodes())
        tree.deleteNode(new Pos(1,1,0))
        assertTypology(tree.el, new TreeTypology([2]))

        let activeCard = tree.getCard()
        expect(activeCard.pos().equals(new Pos(0, 0, 1))).to.be.true
    })

    it("can not delete the last node", () => {
        let tree = new Tree(container, defaultConfig())
        tree.deleteNode(new Pos())
        let card = tree.getCard(new Pos())
        expect(card.editor.getText()).to.equal("\n")
        expect(card.node().content).to.equal("\n")
    })

})