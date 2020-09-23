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

test('pull text below upwards', () => {
    const textBox = setup("Hello ")
    textBox.insertLine()
    textBox.insert("World")
    textBox.up()
    expect(textBox.line().content).toBe("Hello ")
    expect(textBox.text()).toBe("Hello World")
    textBox.pull()
    expect(textBox.line().content).toBe("Hello World")
})