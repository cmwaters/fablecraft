import { TextBox, getTextWidth } from '../../text';
import { Point, Size, PaperScope } from 'paper';
import * as fc from 'fast-check'

beforeAll(() => {
    const paper = new PaperScope()
    paper.install(global)
    const canvas = document.createElement('canvas')
    paper.setup(canvas)
})

function setup(str: string): TextBox {
    return new TextBox({
        content: str, 
        position: new Point(0, 0), 
        width: 100,
    });
}

test('basic move cursor', () => {
    const str = "Hello"
    const textBox = setup(str)
    const height = textBox.box.height
    expect(textBox.cursor.row).toBe(0)
    expect(textBox.cursor.column).toBe(str.length)
    expect(textBox.pointer.position.x).toBe(getTextWidth(str, textBox.font))
    textBox.left()
    expect(textBox.cursor.column).toBe(str.length - 1)
    textBox.right()
    expect(textBox.cursor.row).toBe(0)
    expect(textBox.cursor.column).toBe(str.length)
    textBox.right()
    expect(textBox.lineEnd()).toBe(0)
    expect(textBox.cursor.column).toBe(0)
    expect(textBox.cursor.row).toBe(1)
    expect(textBox.box.height).toBeGreaterThan(height)
    textBox.up()
    expect(textBox.cursor.row).toBe(0)
    expect(textBox.cursor.column).toBe(0)
    textBox.shift(2)
    expect(textBox.cursor.column).toBe(2)
    textBox.up()
    expect(textBox.cursor.row).toBe(0)
    expect(textBox.cursor.column).toBe(2)
    textBox.down()
    expect(textBox.lineEnd()).toBe(0)
    expect(textBox.cursor.row).toBe(1)
    expect(textBox.cursor.column).toBe(0)
    textBox.left()
    expect(textBox.line().content).toBe(str)
    expect(textBox.cursor.row).toBe(0)
    expect(textBox.cursor.column).toBe(str.length)
    textBox.down()
    textBox.down()
    expect(textBox.cursor.row).toBe(2)
    expect(textBox.cursor.column).toBe(0)
})

test('move text box', () => {
    const textBox = setup("Hello World")
    expect(new Point(textBox.box.topLeft.x, textBox.box.topLeft.y)).toStrictEqual(new Point(0, 0))
    expect(textBox.box.height).toBe(textBox.font.size)
    let translatePos = new Point(120, 180)
    textBox.translate(translatePos)
    expect(new Point(textBox.box.topLeft.x, textBox.box.topLeft.y)).toStrictEqual(translatePos)
    let movePos = new Point(80, 230)
    textBox.translate(movePos)
    expect(new Point(textBox.box.topLeft.x, textBox.box.topLeft.y)).toStrictEqual(translatePos.add(movePos))
    textBox.move(movePos)
    expect(new Point(textBox.box.topLeft.x, textBox.box.topLeft.y)).toStrictEqual(movePos)
    expect(textBox.resize(50)).toBe((textBox.font.size * 2) + textBox.lineSpacing)
})