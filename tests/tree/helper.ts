import { Node } from "../../tree/node"
import { Pos } from "../../tree/pos"
import Delta from "quill-delta"
import chai from "chai"
import e from "express"
let expect = chai.expect

export const testWidth = 800
export const testHeight = 600

const div = document.createElement('div');
div.id = "test-container"
div.style.width = testWidth + "px";
div.style.height = testHeight + "px";
document.body.appendChild(div)

beforeEach(() => {
    div.innerHTML = "";
})

export class TreeTypology {
    pillars: PillarTypology[] = []

    constructor(families?: number[]) {
        if (families) {
            this.pillars = [{ families }]
        }
    }

    pillar(families: number[]): TreeTypology {
        if (families.length !== this.lastPillarCardCount()) {
            throw new Error("New pillar needs to have as many families as cards in the previous pillar")
        }
        this.pillars.push({ families })
        return this
    }

    lastPillarCardCount(): number {
        let pillar = this.pillars[this.pillars.length - 1]
        let sum = 0
        pillar.families.forEach(cards => sum += cards)
        return sum
    }

    nodes(): Node[] {
        let nodes: Node[] = []
        let uid = 0
        this.pillars.forEach((pillar, depth) => {
            pillar.families.forEach((fam, family) => {
                for (let index = 0; index < fam; index++) {
                    let pos = new Pos(depth, family, index)
                    let node = {
                        uid: uid,
                        pos: pos,
                        content: new Delta().insert(uid.toString()),
                    }
                    nodes.push(node)
                    uid++
                }
            })
        })
        return nodes
    }
}

export type PillarTypology = {
    families: number[]
}

export function assertTypology(el: HTMLElement, typology: TreeTypology): void {
    // assert that the element has a reference
    expect(el.children.length, "expected element to have reference child element").to.equal(1)
    expect(el.children[0].className).to.equal("reference")

    let reference = el.children[0]
    let pLength = typology.pillars.length

    // assert that there are enough pillars (remeber there is always one pillar
    // more than what is initially created)
    expect(reference.children.length).to.equal(pLength + 1)

    for (let i = 0; i < pLength; i++) {
        let pillarEl = reference.children[i]
        let pillar = typology.pillars[i]
        expect(pillarEl.className, "pillar class assertion " + i).to.equal("pillar")
        expect(pillarEl.children.length, "pillar families assertion " + i + " pillar: " + pillarEl.toString()).to.equal(pillar.families.length)
        for (let j = 0; j < pillar.families.length; j++) {
            let familyEl = pillarEl.children[j]
            expect(familyEl.className, "pillar " + i + " family asssertion " + j).to.equal("family")
            expect(familyEl.children.length, "pillar " + i + " family " + j + " cards assertion" ).to.equal(pillar.families[j])
            for (let k = 0; k < pillar.families[j]; k++) {
                let cardEl = familyEl.children[k]
                expect(cardEl.className, "pillar " + i + " family " + j + " card class assertion " + k).to.equal("card ql-container")
            }
        }
    }

    // we expect the last pillar, or the ghost pillar to contain a bunch of empty families
    let finalPillarEl = reference.children[pLength]
    expect(finalPillarEl.className, "pillar class assertion " + pLength).to.equal("pillar")
    expect(finalPillarEl.children.length, "should be as many empty families as cards in the last pillar").to.equal(typology.lastPillarCardCount())
}

export function getNodeAsElement(el: HTMLElement, pos: Pos): HTMLElement {
    expect(el.id).to.equal("test-container")
    return el.children[0].children[pos.depth].children[pos.family].children[pos.index] as HTMLElement
}

export function getPillarAsElement(el: HTMLElement, depth: number): HTMLElement {
    expect(el.id).to.equal("test-container")
    return el.children[0].children[depth] as HTMLElement
}

export function getFamilyAsElement(el: HTMLElement, depth: number, family: number): HTMLElement {
    expect(el.id).to.equal("test-container")
    return el.children[0].children[depth].children[family] as HTMLElement
}

export function assertSize(el: HTMLElement, width: number, height: number) {
    expect(el.offsetWidth).to.equal(width, "different width than expected")
    expect(el.offsetHeight).to.equal(height, "different height than expected")
}

export function assertPosition(el: HTMLElement, top: number, left: number) {
    expect(el.offsetTop).to.equal(top, "different top than expected")
    expect(el.offsetLeft).to.equal(left, "different left than expected")
}