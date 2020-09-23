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

test('initialize text box', () => {
    const str = "Hello"
    const textBox = setup(str)
    expect(textBox.line().content).toBe(str)
})

test('initialize multi-line', () => {
    const str = "This is a very long line"
    const textBox = setup(str)

    expect(textBox.cursor.row).toBe(1)
    expect(textBox.lines.length).toBe(2)
    expect(textBox.text()).toBe(str)
    const longstr = str + " that is now even longer"
    const longerTextBox = setup(longstr)
    expect(longerTextBox.text()).toBe(longstr)
    expect(longerTextBox.cursor.row).toBe(3)
    expect(longerTextBox.lines.length).toBe(4)
})