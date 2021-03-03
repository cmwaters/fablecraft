import chai, { assert } from 'chai'
import { Tree } from "../src/tree"
import { defaultConfig } from "../src/config"
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
        assertTypology(tree.el, new TreeTypology([1]))
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
    expect(el.children[0].id).to.equal("reference")
    // let reference = this.el.firstChild
}
