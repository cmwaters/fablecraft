import chai, { assert } from 'chai'
import { Tree, defaultConfig, Pos } from "../../tree"
import { 
    TreeTypology,
    assertTypology,
    getNodeAsElement,
} from "./helper"
let expect = chai.expect
import { errors } from "../../tree/errors"

let container: HTMLElement

describe("Tree | Creation", () => {
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

    let goodCases = [
        {
            name: "can append a new card", 
            pos: [new Pos(0, 0, 1)],
            typology: new TreeTypology([2])
        },
        {
            name: "can insert a new card",
            pos: [new Pos()], 
            typology: new TreeTypology([2])
        },
        {
            name: "can add a child card", 
            pos: [new Pos(1, 0, 0)],
            typology: new TreeTypology([1]).pillar([1])
        }, 
        {
            name: "can insert a new family",
            pos: [new Pos(0, 0, 1), new Pos(1, 1, 0)],
            typology: new TreeTypology([2]).pillar([0, 1])
        },
        {
            name: "can insert a new pillar", 
            pos: [new Pos(1, 0, 0), new Pos(2, 0, 0)],
            typology: new TreeTypology([1]).pillar([1]).pillar([1])
        }
    ]

    goodCases.forEach(test => {
        it(test.name, () => {
            let tree = new Tree(container, defaultConfig())
            test.pos.forEach(pos => {
                tree.insertNode(pos)
            })
            assertTypology(tree.el, test.typology)
        })
    })

    let badCases = [
        {
            name: "fails with negative position",
            pos: new Pos(-1),
            error: errors.invalidPos,
        }, 
        {
            name: "fails when position doesn't exist (wrong index)",
            pos: new Pos(0, 0, 2),
            error: errors.indexOutOfBounds
        },
        {
            name: "fails when attempting to add another family to the root)",
            pos: new Pos(0, 1, 0),
            error: errors.oneRootFamily
        },
        {
            name: "fails when adding a non root node that doesn't have a parent",
            pos: new Pos(1, 1, 0),
            error: errors.orphanNodef(1, 0)
        },
        {
            name: "fails when pillar doesn't exist", 
            pos: new Pos(2, 0, 0),
            error: errors.depthExceededf(2, 1)
        }

    ]

    badCases.forEach(test => {
        it(test.name, () => {
            let tree = new Tree(container, defaultConfig())
            expect(tree.insertNode.bind(tree, test.pos)).to.throw(test.error)
        })
    })

    it("can insert a card with text", () => {
        let tree = new Tree(container, defaultConfig())
        let node = tree.insertNode(new Pos(), true, "Hello World")
        expect(node.uid).to.equal(1)
        expect(node.pos.equals(new Pos())).to.be.true
        expect(node.content).to.equal("Hello World")
        let nodeEl = getNodeAsElement(tree.el, new Pos())
        expect(nodeEl.children[0].children[0].innerHTML).to.equal("Hello World")
        let card = tree.getCard(new Pos())
        expect(card.editor.getText()).to.equal("Hello World\n")
        setTimeout(() => {
            expect(card.hasFocus()).to.be.true
        }, 150)
    })

})
