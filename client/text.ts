import { Rectangle, Path, Point, PointText, Color } from 'paper'
import paper from 'paper'

const defaultFont: Font = {family: "Arial", size: 16}
const defaultLineSpacing = 5; 

export class TextBox {
    
    box: paper.Rectangle
    lines: paper.PointText[] = []
    cursor: TextPos
    font: Font
    lineSpacing: number
    
    constructor(options: TextBoxOptions) {
        this.cursor = {row: -1, column: 0}
        this.box = new Rectangle(options.position, options.size)
        // let path = new Path.Rectangle(this.box)
        // path.strokeColor = new Color("black")
        options.font ? this.font = options.font : this.font = defaultFont
        options.lineSpacing ? this.lineSpacing = options.lineSpacing : this.lineSpacing = defaultLineSpacing
        this.insertLine()
        this.insert(options.content)
    }

    // input takes a key action and performs the respective action
    input(key: string): void {
        console.log(key)
        console.log(this.cursor)
        switch (key) {
            case "Backspace":
                this.delete(1)
                break;
            case "ArrowLeft":
                this.left()
                break;
            case "ArrowRight":
                this.right()
                break;
            case "ArrowUp":
                this.up()
                break;
            case "ArrowDown":
                this.down()
                break
            case "Enter":
                this.insertLine()
            default:
                // only accept single digit keys TODO: we should probably remove this later on?
                if (key.length === 1) {
                    this.insert(key)
                }
        }
    }
    
    // inserts a string (could be a single letter, word or sentence) to where the cursor currently resides
    // then checks for overflow and balances out the lines
    insert(char: string): void {
        if (this.cursor.column === this.lines[this.cursor.row].content.length) {
            this.lines[this.cursor.row].content+=char
        } else {
            let firstPart = this.lines[this.cursor.row].content.slice(0, this.cursor.column)
            let lastPart = this.lines[this.cursor.row].content.slice(this.cursor.column)
            this.lines[this.cursor.row].content = firstPart + char + lastPart
        }
        // move to the end of the inserted string / character
        this.shift(char.length)
        let overflow = this.overflow()
        if (overflow !== "") {
            this.lines[this.cursor.row].content += " "
            this.down()
            this.return()
            this.insert(overflow)
        }
    }
    
    // delete takes the current cursor position and tries to remove the first x characters to the left
    // potentially overflowing into the line above
    delete(x?: number) {
        if (x === undefined) { x = 1 }
        for (let i = 0; i < x; i++) {
            if (this.cursor.column > 0) {
                this.lines[this.cursor.row].content = remove(this.lines[this.cursor.row].content, this.cursor.column)
                this.cursor.column--;
            } else {
                if (this.cursor.row === 0) {
                    return
                }
                // we will delete the trailing space at the line above
                let index = this.line().content.indexOf(" ")
                // include the space when we bring the word up to the line above
                let word = this.line().content.substr(0, index + 1)
                this.line().content = this.line().content.slice(index + 1)
                // jump to the end of the last line and continue to delete
                this.left()
                this.delete(x - i)
                // insert the word from the previous line
                this.insert(word)
                this.shift(word.length * -1)
            }
        
        }
    }
    
    // overflow checks to see if the current line that the cursor is at is overflowing.
    // if so then cuts the text that is overflowing and returns it else returns an empty string
    overflow(): string {
        let output = ""
        let str = this.lines[this.cursor.row].content
        let width = getTextWidth(str, this.font)
        while (width > this.box.width) { // check for overflow
            const index = str.lastIndexOf(" ")
            if (index === -1) { // rare case that this is all one word
                output = str.slice(str.length - 1) + output
                this.lines[this.cursor.row].content = str.substring(0, str.length - 1)
            } else {
                if (output === "") {
                    output = str.substring(index + 1)
                } else {
                    output = str.substring(index + 1) + " " + output
                }
                this.lines[this.cursor.row].content = str.substring(0, index)
            }
            str = this.lines[this.cursor.row].content
            width = getTextWidth(str, this.font)
        }
        return output
    }

    left(): void {
        if (this.cursor.column === 0 && this.cursor.row > 0) {
            this.up()
            this.cursor.column = this.lineEnd()
        } else if (this.cursor.column > 0) {
            this.cursor.column--
        }
    }

    right(): void {
        if (this.cursor.column === this.lineEnd()) {
            if (this.lastLine()) {
                this.insertLine()
            } else {
                this.down()
                this.return()
            }
        } else {
            this.cursor.column++
        }
    }
    
    // shift moves the cursor along the line by recursively calling either the left or right functions
    shift(amount: number): void {
        for (let i = 0; i < Math.abs(amount); i++) {
            if (amount > 0) {
                this.right()
            } else {
                this.left()
            }
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
    
    // return, like the return in a typewriter moves the cursor back to the far left
    return() { this.cursor.column = 0 }

    down(): void {
        if (this.lastLine()) {
            this.cursor.column = this.lineEnd()
            this.insertLine()
        } else {
            this.cursor.row++
            if (this.cursor.column > this.lineEnd()) {
                this.cursor.column = this.lineEnd()
            }
        }
    }
    
    lastLine(): boolean {
        return this.cursor.row === this.lines.length - 1
    }

    line(): paper.PointText {
        return this.lines[this.cursor.row]
    }

    lineEnd(): number {
        return this.line().content.length
    }
    
    textStart(): void {
        this.cursor.row = 0;
        this.cursor.column = 0;
    }
    
    currentChar(): string {
        return this.line().content.charAt(this.cursor.column)
    }

    insertLine() {
        let pos = new Point(this.box.x, this.box.y + this.font.size)
        if (this.lines.length !== 0) {
            pos = this.lines[this.lines.length - 1].point.add(new Point(0, this.font.size + this.lineSpacing))
        }
        // extract out the remaining part of this line (if there is any) to move into the next line
        let content = ""
        if (this.lines.length !== 0 && this.cursor.column < this.lineEnd()) {
            content = this.line().content.slice(this.cursor.column)
            // update this line 
            this.line().content = this.line().content.slice(0, this.cursor.column - 1)
        }
        const newLine = new PointText({
            content: content,
            point: pos,
            fontFamily: this.font.family,
            fontSize: this.font.size,
            fontWeight: this.font.weight !== undefined ? this.font.weight : 'normal'
        })
        // add line and move cursor to the start of that line
        this.cursor.row++
        this.return()
        this.lines.splice(this.cursor.row, 0, newLine)
    }
    
    text(): string {
        let str = ""
        this.lines.forEach(line => {
            str += line.content
        })
        return str
    }
    
    formattedText(): string {
        let str = ""
        this.lines.forEach(line => {
            str += line.content + "\n"
        })
        return str
    }
    
    string(): string {
        return "text:\n" + this.formattedText() + "cursor pos, x: " + 
        this.cursor.column + " y: " + this.cursor.row + "\nat letter: " + this.currentChar()
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

export function remove(str: string, index: number): string {
    const before = str.slice(0, index - 1)
    const after = str.slice(index)
    return before + after
}