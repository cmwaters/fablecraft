import { View } from '../view';
import { Snippet } from '../story'
import { Config } from '../config'
import { Point, Size, PaperScope } from 'paper';
import { StrGen, NumGen } from '../libs/rand'
// import * as fc from 'fast-check'

let view: View
let defaultPos = new Point(100, 100)
let defaultSize = new Size(500, 500)
let snippets = [{
    text: "Hello World",
    depth: 1,
    index: 1,
}, {
    text: "Welcome to Fablecraft",
    depth: 1,
    index: 2,
}, {
    text: "An elegant text editor with an emphasis on structured design",
    depth: 1,
    index: 3,
}]

beforeEach(() => {
    const paper = new PaperScope()
    paper.install(global)
    const canvas = document.createElement('canvas')
    paper.setup(canvas)
    view = new View(paper.project, defaultPos, defaultSize, 
    Config.view.margin, Config.view.padding, snippets)
})

function makeRandomSnippets(length: number): Snippet[] {
    let snippets: Snippet[] = []
    for (let i = 0; i < length; i ++) {
        snippets.push({
            text: StrGen.words(NumGen.int(20, 5)),
            depth: 1,
            index: i + 1
        })
    }
    return snippets
}