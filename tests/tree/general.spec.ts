import chai, { assert } from 'chai'
import { Tree, defaultConfig, Pos } from "../../tree/"
import { el, mount } from "redom"
import Delta from "quill-delta"
import { 
    TreeTypology,
    assertTypology,
    getNodeAsElement,
    assertSize,
    getPillarAsElement,
    getFamilyAsElement,
    assertPosition,
    testWidth,
    testHeight,
} from "./helper"
let expect = chai.expect

let container: HTMLElement
let config = defaultConfig()

describe.only("Tree | Constructor", () => {
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

    it.only("can create a blank tree", done => {
        let tree = new Tree(container, config)
        expect(tree.el).to.equal(container, "tree should correctly use the html element")
        assertTypology(tree.el, new TreeTypology([1])) // a single pillar with a single card
        let nodeEl = getNodeAsElement(tree.el, new Pos()) // get the first card
        let node = tree.getCard(new Pos())
        expect(nodeEl).to.equal(node.el)
        expect(node.editor.getText()).to.equal("\n")
        let pillarEl = getPillarAsElement(container, 0)
        expect(pillarEl.offsetWidth).to.equal(400, "pillar should be the correct width")
        setTimeout(() => {
            // after 100 seconds we should have focused on the first card
            expect(node.hasFocus()).to.be.true
            assertSize(node.el, 400, 42)
            assertPosition(node.el, config.margin.family, (testWidth - 400)/ 2)
            let familyEl = getFamilyAsElement(container, 0, 0)
            assertSize(familyEl, 400, 42 + 2 * config.margin.family)
            assertPosition(familyEl, 0, 0)
            done()
        }, 300)
    })


    it("can create a tree from existing nodes", () => {
        let typology = new TreeTypology([5]).pillar([0, 3, 0, 4, 1])
        let nodes = typology.nodes()
        let tree = new Tree(container, config, nodes)
        assertTypology(tree.el, typology)
    })

})

describe("Tree | General", () => {
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
        let tree = new Tree(container, config)
        tree.modifyNode(new Pos(), new Delta().insert("Hello World"))

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


