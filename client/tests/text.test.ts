import { TextBox } from '../text';
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

test('basic move cursor', () => {
    const str = "Hello"
    const textBox = setup(str)
    const height = textBox.box.height
    expect(textBox.cursor.row).toBe(0)
    expect(textBox.cursor.column).toBe(str.length)
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

test('add characters to text box', () => {
    let str = "Hel"
    let textBox = setup(str)
    textBox.insert("o")
    expect(textBox.line().content).toBe("Helo")
    textBox.left()
    textBox.insert("l")
    expect(textBox.line().content).toBe("Hello")
    textBox.down()
    textBox.insert("W")
    expect(textBox.line().content).toBe("W")
    expect(textBox.text()).toBe("HelloW")
    textBox.insert("orld")
    expect(textBox.text()).toBe("HelloWorld")
    textBox.insert(" I am your maker")
    expect(textBox.text()).toBe("HelloWorld I am your maker")
    
    str = "Hello painters"
    textBox = setup(str)
    textBox.insert(" ")
    expect(textBox.lines[0].content).toBe("Hello ")
    expect(textBox.lines[1].content).toBe("painters ")
})

test('delete characters in text box', () => {
    const str = "this is a multiline text"
    const textBox = setup(str)
    textBox.up()
    textBox.delete(2)
    expect(textBox.text()).toBe("this is multiline text")
    textBox.down()
    textBox.right()
    textBox.delete(4)
    expect(textBox.text()).toBe("this is multi text")
    textBox.return()
    textBox.delete()
    expect(textBox.text()).toBe("this ismulti text")
    expect(textBox.line().content).toBe("this ismulti ")
    textBox.delete(8)
    expect(textBox.text()).toBe("multi text")
})

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