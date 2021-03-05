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
let tree: Tree

describe("Fable Tree | Movement", () => {
    before(() => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null
        container = div!
        container.innerHTML = ""
        expect(container.children.length).to.equal(0)
        let nodes = new TreeTypology([5]).pillar([0,1,2,3,4]).nodes()
        tree = new Tree(container, defaultConfig(), nodes)
    })

    afterEach(() => {
        // clear the contents after ever test
        container.innerHTML = ""
    })

    it("can move a card down within the same family", () => {
        let oldPos = new Pos(1, 3, 1)
        let newPos = oldPos.copy().increment()

        let upperNode = tree.getNode(oldPos)
        let lowerNode = tree.getNode(newPos)

        tree.moveNode(oldPos, newPos)

        // upper node shold have moved down
        expect(tree.getNode(newPos).id(), tree.string()).to.equal(upperNode.id())

        // lower node should have moved up
        expect(tree.getNode(oldPos).id(), tree.string()).to.equal(lowerNode.id())
    })

    it("can move a card up within the same family", () => {
        let oldPos = new Pos(1, 4, 2)
        let newPos = oldPos.copy().decrement()

        let upperNode = tree.getNode(newPos)
        let lowerNode = tree.getNode(oldPos)

        tree.moveNode(oldPos, newPos)

        // upper node shold have moved down
        expect(tree.getNode(newPos).id(), tree.string()).to.equal(upperNode.id())

        // lower node should have moved up
        expect(tree.getNode(oldPos).id(), tree.string()).to.equal(lowerNode.id())
    })
})

