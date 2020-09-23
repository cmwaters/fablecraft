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

test('line should never start with a space', ()=> {
    const textBox = new TextBox({
        width: 100
    })
    fc.assert(
        fc.property(fc.string(12), fc.string(12), fc.string(12), (a, b, c) => {
            textBox.insert(a + " " + b + " " + c)
            expect(textBox.lines[textBox.cursor.row].content[0]).not.toBe(" ")
        })
    )
})