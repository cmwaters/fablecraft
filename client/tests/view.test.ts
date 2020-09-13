import { View } from '../view';
import { Snippet } from '../story'
import { Config } from '../config'
import { Point, Size, PaperScope } from 'paper';
import { StrGen, NumGen } from '../libs/rand'
// import * as fc from 'fast-check'

let view: View
let defaultPos = new Point(100, 100)
let defaultSize = new Size(500, 500)
let snippets = makeRandomSnippets(3)
// [{
//     text: "Hello World",
//     depth: 1,
//     index: 1,
// }, {
//     text: "Welcome to Fablecraft",
//     depth: 1,
//     index: 2,
// }, {
//     text: "An elegant text editor with an emphasis on structured design",
//     depth: 1,
//     index: 3,
// }]

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

test('initialize view', () => {
    let currentCard = view.card()
    expect(currentCard.box.bounds.width).toBe(Config.cardWidth.min)
    expect(view.location).toBe(defaultPos)
    expect(currentCard.position()).toStrictEqual(new Point(150, 140))
    expect(view.cards.length).toBe(3)
    expect(view.activeCardIdx).toBe(0)
    let height = currentCard.size().height
    expect(view.cards[1].position()).toStrictEqual(new Point(150, 140 + height + Config.view.padding.height))
})

test('resize view', () => {
    let size = new Size(1000, 1000)
    view.resize(size)
    expect(view.size).toStrictEqual(size)
    expect(view.card().box.bounds.width).toBe(size.width/2)
    expect(view.card().position()).toStrictEqual(new Point(350, 140))
    let height = view.card().size().height
    view.focus(1)
    expect(view.card().box.bounds.width).toBe(size.width/2)
    expect(view.card().position()).toStrictEqual(new Point(350, 140 + height + Config.view.padding.height))
    
})