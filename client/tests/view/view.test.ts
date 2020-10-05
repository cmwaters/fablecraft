import { View } from '../../view';
import { Snippet } from '../../story'
import { Config } from '../../config'
import { Point, Size, PaperScope } from 'paper';
import { LoremIpsum } from "lorem-ipsum";
// import * as fc from 'fast-check'

let view: View
let cardCount = 4;
let defaultPos = new Point(100, 100)
let defaultSize = new Size(500, 500)
let snippets = makeRandomSnippets(cardCount)

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
            index: i + 1,
            parentIndex: null
        })
    }
    return snippets
}

test('initialize view', () => {
    let currentCard = view.card()
    expect(currentCard.box.bounds.width).toBe(Config.cardWidth.min)
    expect(view.location).toBe(defaultPos)
    expect(currentCard.position()).toStrictEqual(new Point(150, 140))
    expect(view.cards[0].length).toBe(cardCount)
    expect(view.activeCardIdx).toBe(0)
    expect(view.currentDepth).toBe(0)
    let height = currentCard.size().height
    expect(view.cards[0][1].position()).toStrictEqual(new Point(150, 140 + height + Config.view.padding.height))
})

test('resize view', () => {
    let size = new Size(1000, 1000)
    view.resize(size)
    expect(view.size).toStrictEqual(size)
    expect(view.card().box.bounds.width).toBe(size.width/2)
    expect(view.card().position()).toStrictEqual(new Point(350, 140))
    let height = view.card().size().height
    view.focus(0, 1)
    expect(view.card().box.bounds.width).toBe(size.width/2)
    expect(view.card().position()).toStrictEqual(new Point(350, 140 + height + Config.view.padding.height))  
})

test('pull text below', () => {
    
})

test('traverse up and down cards', () => {
    view.keydown("Arrow Down")
    expect(view.activeCardIdx).toBe(1)
    expect(view.cards[0][0].bar.visible).toBe(true)
})