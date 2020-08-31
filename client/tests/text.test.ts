import { TextBox, remove } from '../text';
import { Point, Size, PaperScope } from 'paper';
import { text } from 'body-parser';

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
        size: new Size(100, 100)
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
    textBox.up()
    expect(textBox.cursor.row).toBe(0)
    expect(textBox.cursor.column).toBe(0)
    textBox.right()
    textBox.right()
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
    const str = "Hel"
    const textBox = setup(str)
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
})

test('delete characters in text box', () => {
    const str = "this is a multiline text"
    const textBox = setup(str)
    textBox.up()
    textBox.delete(2)
    expect(textBox.text()).toBe("this is multiline text")
    textBox.down()
    textBox.delete(1)
    console.log(textBox.formattedText())
    expect(textBox.text()).toBe("this is multilie text")
    textBox.return()
    textBox.delete(1)
    expect(textBox.text()).toBe("this is multiline text")
    textBox.return()
    textBox.delete(1)
    expect(textBox.text()).toBe("this is multiline text")
})

test('remove function', () => {
    const str = "Hello World"
    expect(remove(str, 3)).toBe("Helo World")
})