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
        let node = tree.getCard(new Pos())
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

describe("Fable Tree | General", () => {
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

    it("can edit a card's text", () => {
        let tree = new Tree(container, defaultConfig())
        tree.modifyNode(new Pos(), "Hello World")

        let card = tree.getCard(new Pos())
        expect(card.editor.getText()).to.equal("Hello World\n")
    })

    it("can select different cards", () => {
        let tree = new Tree(container, defaultConfig(), new TreeTypology([5]).pillar([0, 1, 2, 3, 4]).nodes())

        let positions = [
            new Pos(0, 0, 0),
            new Pos(0, 0, 3),
            new Pos(1, 1, 0),
            new Pos(1, 3, 2)
        ]

        positions.forEach(pos => {
            tree.selectNode(pos)
            expect(tree.getCard().pos().equals(pos)).to.be.true
        })

        tree.selectNode(new Pos(), true)
        setTimeout(() => {
            expect(tree.getCard().hasFocus()).to.be.true
        }, 150)
    })
})


