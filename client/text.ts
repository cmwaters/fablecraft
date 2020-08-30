import { Rectangle, Path, Point, PointText, Color } from 'paper'
import paper from 'paper'

const defaultFont: Font = {family: "Arial", size: 16}
const defaultLineSpacing = 5; 

export class TextBox {
    _class: string = "TextBox"
    
    box: paper.Rectangle
    lines: paper.PointText[] = []
    cursor: TextPos
    font: Font
    lineSpacing: number
    
    constructor(options: TextBoxOptions) {
        this.cursor = {row: -1, column: 0}
        this.box = new Rectangle(options.position, options.size)
        let path = new Path.Rectangle(this.box)
        path.strokeColor = new Color("black")
        options.font ? this.font = options.font : this.font = defaultFont
        options.lineSpacing ? this.lineSpacing = options.lineSpacing : this.lineSpacing = defaultLineSpacing
        this.parse(options.content)
    }

    input(key: string): void {
        console.log(key)
        console.log(this.cursor)
        switch (key) {
            case "Backspace":
                this.delete()
                break;
            case "ArrowLeft":
                if (this.cursor.column !== 0) {
                    this.cursor.column--
                } else {
                    
                
                }
            default:
                this.insert(key)
        }
    }
    
    append(char: string): void {
        
    }

    delete() {
        if (this.lines[this.cursor.row].content === "" && this.cursor.row > 0) {
            this.lines.splice(this.cursor.row, 1)
            this.cursor.row--
        } else {
            this.lines[this.cursor.row].content = remove(this.lines[this.cursor.row].content, this.cursor.column)
            this.cursor.column--;
        }
    }

    insert(char: string): void {
        if (this.cursor.column === this.lines[this.cursor.row].content.length) {
            this.lines[this.cursor.row].content+=char
        } else {
            let firstPart = this.lines[this.cursor.row].content.slice(0, this.cursor.column)
            let lastPart = this.lines[this.cursor.row].content.slice(this.cursor.column)
            this.lines[this.cursor.row].content = firstPart + char + lastPart
        }
        this.cursor.column++
        let str = this.lines[this.cursor.row].content
        let width = getTextWidth(str, this.font)
        console.log(width)
        if (width > this.box.width) { // check for overflow
            const index = str.lastIndexOf(" ")
            if (index === -1) { // rare case that this is all one word
                
            } else {
                let lastWord = str.substring(index + 1)
                this.lines[this.cursor.row].content = str.substring(0, index - 1)
                this.insertLine(lastWord)
            }
        }
    }

    left(): void {
        if (this.cursor.column === 0 && this.cursor.row > 0) {
            this.up()
        } else if (this.cursor.column > 0) {
            this.cursor.column--
        }
    }

    right(): void {
        if (this.cursor.column === this.lineEnd()) {
            this.cursor.column = 0;
            this.down()
        } else {
            this.cursor.column++
        }
    }

    up(): void {
        if (this.cursor.row > 0) {
            this.cursor.row--
            if (this.cursor.column > this.lineEnd()) {
                this.cursor.column = this.lineEnd()
            }
        }
    }

    down(): void {
        if (this.cursor.row == this.lines.length - 1) {
            this.insertLine()
        } else {
            this.cursor.row++
            if (this.cursor.column > this.lineEnd()) {
                this.cursor.column = this.lineEnd()
            }
        }
    }

    line(): paper.PointText {
        return this.lines[this.cursor.row]
    }

    lineEnd(): number {
        return this.line().content.length - 1
    }

    // delete(position: TextPos): void {

    // }

    insertLine(content?: string | undefined) {
        let pos = new Point(this.box.x, this.box.y + this.font.size)
        if (this.lines.length !== 0) {
            pos = this.lines[this.lines.length - 1].point.add(new Point(0, this.font.size + this.lineSpacing))
        }
        const newLine = new PointText({
            content: content === undefined ? "" : content,
            point: pos,
            fontFamily: this.font.family,
            fontSize: this.font.size,
            fontWeight: this.font.weight !== undefined ? this.font.weight : 'normal'
        })
        this.cursor.row++
        this.cursor.column = newLine.content.length
        this.lines.splice(this.cursor.row, 0, newLine)
    }

    parse(content: string | undefined) {
        // if (content === undefined) { 
            this.insertLine(content)
            return
        // }
        // let width = getTextWidth(content, this.font)
        // for (width > this.box.width) {
        //     this.lines.push(new PointText({
        //         point: new Point(this.box.x, this.box.y)
        //     }))
        // }
    }

    marshal(): string {
        return "not yet implemented"
    }



}

function getTextWidth(text: string, font: Font): number {
    // re-use canvas object for better performance
    var canvas = <HTMLCanvasElement> document.createElement("canvas");
    var context = canvas.getContext("2d");
    if (context === null) return 0;
    context.font = fontString(font)
    var metrics = context.measureText(text);
    return metrics.width;
}

type TextBoxOptions = {
    content?: string,
    position: paper.Point,
    size: paper.Size,
    font?: Font
    lineSpacing?: number
}

type TextPos = {
    row: number,
    column: number
}

type Font = {
    family: string,
    size: number,
    weight?: string,
}

function fontString(font: Font) {
    return font.size.toString() + "px " + font.family
}

function remove(str: string, index: number): string {
    const before = str.slice(0, index - 1)
    const after = str.slice(index)
    return before + after
}