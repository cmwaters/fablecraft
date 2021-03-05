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
import { errors } from "../src/errors"

let container: HTMLElement

describe.only("Fable Tree | Creation", () => {
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

    it("can append a new card", () => {
        let tree = new Tree(container, defaultConfig())
        let appendPos = new Pos(0, 0, 1)

        tree.insertNode(appendPos)

        assertTypology(tree.el, new TreeTypology([2]))
        let card = tree.getCard(appendPos)
        expect(card.getNode().uid).to.equal(1)
    })

    it("can insert a new card", () => {
        let tree = new Tree(container, defaultConfig())
        let appendPos = new Pos()

        tree.insertNode(appendPos)

        assertTypology(tree.el, new TreeTypology([2]))
    })

    let testCases = [
        {
            name: "fails with negative position",
            pos: new Pos(-1),
            error: errors.invalidPos,
        }
    ]

    testCases.forEach(test => {
        it(test.name, () => {
            let tree = new Tree(container, defaultConfig())
            expect(tree.insertNode.bind(tree, test.pos)).to.throw(test.error)
        })
    })

})
