import { Card } from '../card';
import { PaperScope, Point, Size } from 'paper';

let card: Card;
let margin: paper.Size
let fontSize: number
let defaultWidth = 100
let defaultPos = new Point(100, 100)
// shoud be the same as in card.ts
let defaultBarHeight = 30

beforeEach(() => {
    const paper = new PaperScope()
    paper.install(global)
    const canvas = document.createElement('canvas')
    paper.setup(canvas)
    // use default margin (will likely later move to config)
    card = new Card(paper.project, null, defaultPos, defaultWidth)
    margin = card.margin
    fontSize = card.text.font.size
})

test('initialize card', () => {
    expect(card.box.bounds.width).toBe(defaultWidth)
    expect(card.bar.bounds.width).toBe(defaultWidth)
    expect(card.text.box.width).toBe(defaultWidth - (2 * margin.width))
    expect(card.position()).toStrictEqual(defaultPos)
    expect(card.size().height).toBe(fontSize + (2 * margin.height) + defaultBarHeight) 
})

test('insert text into card', () => {
    let str = "Hello World"
    card.input(str)
    expect(card.text.text()).toBe(str)
})

test('move card', () => {
    let newPos = new Point(200, 200)
    card.move(newPos)
    expect(card.position()).toStrictEqual(newPos)
    expect(card.text.box.topLeft.clone()).toStrictEqual(newPos.add(new Point(margin.width, margin.height)))
    newPos = new Point(0, 300)
    card.move(newPos)
    expect(card.position()).toStrictEqual(newPos)
    expect(card.text.box.topLeft.clone()).toStrictEqual(newPos.add(new Point(margin.width, margin.height)))
})

test('translate card', () => {
    let originalSize = card.size()
    card.translate(defaultPos)
    expect(card.position()).toStrictEqual(defaultPos.multiply(2))
    expect(card.size()).toStrictEqual(originalSize)
})

test('resize card', () => {
    card.resize(90)
    expect(card.position()).toStrictEqual(defaultPos)
    expect(card.size()).toStrictEqual(new Size(90, fontSize + (2 * margin.height) + defaultBarHeight))
    card.text.insert("aaaa aaaa aaaa")
    expect(card.text.lines.length).toBe(3)
    card.resize(200)
    expect(card.position()).toStrictEqual(defaultPos)
    expect(card.text.lines.length).toBe(1)
    expect(card.size()).toStrictEqual(new Size(200, fontSize + (2 * margin.height) + defaultBarHeight))
    card.resize(80)
    console.log(card.text.string())
    expect(card.text.lines.length).toBe(3)
    expect(card.size()).toStrictEqual(new Size(80, (3 * fontSize + 2 * card.text.lineSpacing) + (2 * margin.height) + defaultBarHeight))
})

// test('activate and focus card', () => {
//     expect(card.box.visible).toBe(false)
//     card.activate()
// })