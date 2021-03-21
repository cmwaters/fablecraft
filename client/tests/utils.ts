import { Node, Pos } from "fabletree"
import Delta from "quill-delta"
import { expect } from "chai";
import localforage from "localforage"
import { Story, Header } from "../src/model"

export function expectEqualStories(s1: Story, s2: Story) {
    expectEqualHeaders(s1.header, s2.header)
    expect(s1.nodes.length).to.equal(s2.nodes.length)

    for (let index = 0; index < s1.nodes.length; index++) {
        expectEqualNodes(s1.nodes[index], s2.nodes[index])
    }
}

export function expectEqualHeaders(h1: Header, h2: Header) {
    expect(h1.uid).to.equal(h2.uid, "uid")
    expect(h1.title).to.equal(h2.title, "title")
    expect(h1.description).to.equal(h2.description, "description")
    expect(h1.latestHeight).to.equal(h2.latestHeight, "latestHeight")
    expect(h1.stateHeight).to.equal(h2.stateHeight, "stateHeight")
}

export function expectEqualNodes(n1: Node, n2: Node) {
    expect(n1.uid).to.equal(n2.uid);
    expectEqualPositions(n1.pos, n2.pos);
    expectEqualDeltas(n1.content, n2.content);
}

export function expectEqualPositions(p1: Pos, p2: Pos) {
    expect(p1.index).to.equal(p2.index)
    expect(p1.family).to.equal(p2.family)
    expect(p1.depth).to.equal(p2.depth)
}

export function expectEqualDeltas(d1: Delta, d2: Delta) {
    let diff = d1.diff(d2);

    expect(diff.ops.length).to.equal(0, JSON.stringify(diff))
}

export async function expectStateSize(id: number, size: number) {
    let nodes = localforage.createInstance({
        name: "fable",
        storeName: "state" + id.toString(),
    })
    let len = await nodes.length()
    expect(len).to.equal(size)
}

export async function expectHistorySize(id: number, size: number) {
    let history = localforage.createInstance({
        name: "fable",
        storeName: "history" + id.toString(),
    })
    let len = await history.length()
    expect(len).to.equal(size)
}

export function printNodes(nodes: Node[]): string {
    let string = ""
    nodes.forEach(node => {
        string += "Node{uid: " + node.uid + ", pos: " + node.pos.string() + " contents: " + node.content.toString() + " }\n"
    })
    return string
}