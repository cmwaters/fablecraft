import chai, { assert } from 'chai'
import { Tree } from "../src/tree"
import { defaultConfig } from "../src/config"
import { Pos } from "../src/pos"
import {
    TreeTypology,
    assertTypology,
    getNodeAsElement,
} from "./utils"
let expect = chai.expect
import { errors } from "../src/errors"

let container: HTMLElement
let tree: Tree

describe("Fable Tree | Movement", () => {
    before(() => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null
        container = div!
        container.innerHTML = ""
        expect(container.children.length).to.equal(0)
    })

    afterEach(() => {
        // clear the contents after ever test
        container.innerHTML = ""
    })

    it("can move a card down within the same family", () => {
        let nodes = new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes()
        tree = new Tree(container, defaultConfig(), nodes)

        let oldPos = new Pos(1, 3, 1)
        let newPos = oldPos.copy().increment()

        let upperNode = tree.getCard(oldPos)
        let lowerNode = tree.getCard(newPos)

        tree.moveNode(oldPos, newPos)

        // upper node shold have moved down
        expect(tree.getCard(newPos).id(), tree.string()).to.equal(upperNode.id())

        // lower node should have moved up
        expect(tree.getCard(oldPos).id(), tree.string()).to.equal(lowerNode.id())
    })

    it("can move a card up within the same family", () => {
        let nodes = new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes()
        tree = new Tree(container, defaultConfig(), nodes)

        let oldPos = new Pos(1, 4, 2)
        let newPos = oldPos.copy().decrement()

        let upperNode = tree.getCard(newPos)
        let lowerNode = tree.getCard(oldPos)

        tree.moveNode(oldPos, newPos)

        // upper node shold have moved down
        expect(tree.getCard(oldPos).id(), tree.string()).to.equal(upperNode.id())

        // lower node should have moved up
        expect(tree.getCard(newPos).id(), tree.string()).to.equal(lowerNode.id())
    })

    it("can move a card up to the above family", () => {
        let nodes = new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes()
        tree = new Tree(container, defaultConfig(), nodes)

        let oldPos = new Pos(1, 2, 0)
        let newPos = new Pos(1, 1, 1)

        tree.moveNode(oldPos, newPos)
        console.log(tree.string())

        assertTypology(tree.el, new TreeTypology([5]).pillar([0,2,1,3,4]))
    })

    it("can not move a card to the bottom of it's own family", () => {
        let nodes = new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes()
        tree = new Tree(container, defaultConfig(), nodes)

        let oldPos = new Pos(1, 3, 0)
        let newPos = new Pos(1, 3, 3)

        expect(tree.moveNode.bind(tree, oldPos, newPos)).to.throw(errors.indexOutOfBounds)
    })

    it("can move all it's ancestors", () => {
        let nodes = new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes()
        tree = new Tree(container, defaultConfig(), nodes)

        let oldPos = new Pos(0, 0, 2)
        let newPos = new Pos(0, 0, 3)

        tree.moveNode(oldPos, newPos)

        assertTypology(tree.el, new TreeTypology([5]).pillar([0, 1, 3, 2, 4]))
    })

    it("can move to a different pillar", () => {
        let nodes = new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes()
        tree = new Tree(container, defaultConfig(), nodes)

        let oldPos = new Pos(0, 0, 2)
        let newPos = new Pos(1, 3, 0)

        tree.moveNode(oldPos, newPos)

        assertTypology(tree.el, new TreeTypology([4]).pillar([0, 1, 3, 5]).pillar([0, 0, 0, 0, 2, 0, 0, 0, 0]))
    })
})

