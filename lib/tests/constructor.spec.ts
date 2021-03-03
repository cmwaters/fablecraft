import chai, { assert } from 'chai'
import { Tree } from "../src/tree"
import { defaultConfig } from "../src/config"
import { Pos } from "../src/node"
let expect = chai.expect

let container: HTMLElement

describe("Fable Tree | Constructor", () => {
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

    it("can create a tree", () => {
        let tree = new Tree(container, defaultConfig())
        expect(tree.el).to.equal(container)
        assertTypology(tree.el, new TreeTypology([1])) // a single pillar with a single card
        let nodeEl = getNodeAsElement(tree.el, new Pos()) // get the first card
        let node = tree.getNode(new Pos())
        expect(nodeEl).to.equal(node.el)
        expect(node.editor.getText()).to.equal("Welcome to Fablecraft\n")
    })
})

class TreeTypology {
    pillars: PillarTypology[] = []

    constructor(families?: number[]) {
        if (families) {
            this.pillars = [{families}]
        }
    }

    pillar(families: number[]): TreeTypology {
        this.pillars.push({families})
        return this
    }
}

type PillarTypology = {
    families: number[]
}

function assertTypology(el: HTMLElement, typology: TreeTypology): void {
    // assert that the element has a reference
    expect(el.children.length).to.equal(1)
    expect(el.children[0].className).to.equal("reference")
    
    let reference = el.children[0]

    // assert that there are enough pillars (remeber there is always one pillar
    // more than what is initially created)
    expect(reference.children.length).to.equal(typology.pillars.length + 1)

    for (let i = 0; i < typology.pillars.length; i++) {
        let pillarEl = reference.children[i]
        let pillar = typology.pillars[i]
        expect(pillarEl.className).to.equal("pillar")
        expect(pillarEl.children.length).to.equal(pillar.families.length)
        for (let j = 0; j < pillar.families.length; j++) {
            let familyEl = pillarEl.children[j]
            expect(familyEl.className).to.equal("family")
            expect(familyEl.children.length).to.equal(pillar.families[j])
            for (let k = 0; k < pillar.families[j]; k++) {
                let cardEl = familyEl.children[k]
                expect(cardEl.className).to.equal("card ql-container")
            }
        }
    }
}

function getNodeAsElement(el: HTMLElement, pos: Pos): HTMLElement {
    return el.children[0].children[pos.depth].children[pos.family].children[pos.index] as HTMLElement
}