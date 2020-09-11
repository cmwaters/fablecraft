import { Rectangle, Path, Point, PointText, Color, Size } from 'paper'
import paper from 'paper'
import { defaultReportMessage } from 'fast-check';

const defaultFont: Font = {family: "Arial", size: 16}
const defaultLineSpacing = 6; 

export class TextBox {
    
    box: paper.Rectangle
    lines: paper.PointText[] = []
    cursor: TextPos
    pointer: paper.Path.RegularPolygon
    font: Font
    private widthMap: number[][] = []
    lineSpacing: number
    
    constructor(options: TextBoxOptions) {
        this.cursor = {row: -1, column: 0}
        options.font ? this.font = options.font : this.font = defaultFont
        options.lineSpacing ? this.lineSpacing = options.lineSpacing : this.lineSpacing = defaultLineSpacing
        if (options.position === undefined) {
            this.box = new Rectangle(new Point(0, 0), new Size(options.width, this.font.size))
        } else {
            this.box = new Rectangle(options.position, new Size(options.width, this.font.size))
        }
        console.log("height: " + this.box.height)
        this.pointer = new Path.RegularPolygon(this.box.bottomLeft.add(new Point(0, this.lineSpacing)), 3, 5)
        this.pointer.fillColor = new Color('black')
        // let path = new Path.Rectangle(this.box)
        // path.strokeColor = new Color("black")
        this.insertLine()
        console.log("height: " + this.box.height)
        if (options.content !== undefined)
            this.insert(options.content)
        console.log("height: " + this.box.height)
        console.log("line: " + this.lines.length)
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
                this.slidePointer()
                break;
            case "ArrowRight":
                this.right()
                this.slidePointer()
                break;
            case "ArrowUp":
                this.up()
                this.slidePointer()
                break;
            case "ArrowDown":
                this.down()
                this.slidePointer()
                break
            case "Enter":
                this.insertLine()
                this.slidePointer()
            default:
                // only accept single digit keys TODO: we should probably remove this later on?
                if (key.length === 1) {
                    this.insert(key)
                }
        }
    }
    
    // inserts a string (could be a single letter, word or sentence) to where the cursor currently resides
    // then checks for overflow and balances out the lines
    insert(str: string): void {
        for (let idx = 0; idx < str.length; idx++) {
            this.insertSingle(str.charAt(idx))
        }
    }

    private insertSingle(char: string): void {
        // can't start a line with a space or have two spaces in a row
        if (char === "" || this.cursor.column === 0 && char === " " || char === " " && this.line().content.charAt(this.cursor.column - 1) === " ") {
            return
        }
        // insert character at the end of the line
        if (this.cursor.column === this.lineEnd()) {
            this.lines[this.cursor.row].content+=char
            let width = getTextWidth(this.line().content, this.font)
            this.widthMap[this.cursor.row].push(width)
            // slide cursor across
            this.right()

            // check for overflow
            let overflow = this.overflow()
            if (overflow !== "") {
                // add the overflowing characters to the line below
                this.line().content += " "
                this.down()
                this.return()
                this.insert(overflow)                
            }
        } else {
            // insert character in the middle of the line
            let firstPart = this.lines[this.cursor.row].content.slice(0, this.cursor.column)
            // update width by finding the difference between the previous width
            let initialWidth = this.widthMap[this.cursor.row][this.cursor.column + 1]
            let newWidth = getTextWidth(firstPart + char, this.font)
            let diff = newWidth - initialWidth
            this.widthMap[this.cursor.row][this.cursor.column + 1] = newWidth
            for (let idx = this.cursor.column + 2; idx < this.lineEnd(); idx++) {
                this.widthMap[this.cursor.row][idx]+= diff 
            }
            let lastPart = this.lines[this.cursor.row].content.slice(this.cursor.column)
            this.lines[this.cursor.row].content = firstPart + char + lastPart
            // slide cursor across
            this.right()

            // check for overflow
            let overflow = this.overflow()
            if (overflow !== "") {
                this.line().content += " "
                let column = this.cursor.column
                let row = this.cursor.row
                // add the overflowing characters to the line below
                this.down()
                this.return()
                this.insert(overflow)
                // return the cursor to where it was beforehand
                this.cursor.column = column
                this.cursor.row = row
                
            }
        }
        this.slidePointer()

    }
    
    // delete takes the current cursor position and tries to remove the first x characters to the left
    // potentially overflowing into the line above
    delete(x?: number) {
        if (x === undefined) { x = 1 }
        for (let i = 0; i < x; i++) {
            if (this.cursor.column > 0) {
                this.lines[this.cursor.row].content = remove(this.lines[this.cursor.row].content, this.cursor.column)
                this.left();
                // we are making a deletion at the end of the line so remove the last saved width
                if (this.cursor.column === this.lineEnd()) {
                    this.widthMap[this.cursor.row] = this.widthMap[this.cursor.row].slice(0, this.cursor.column + 1)
                } else {
                    // we are making a deletion somewhere in the line. Recalculate the new width
                    for (let idx = this.cursor.column + 1; idx < this.lineEnd(); idx++) {
                        this.widthMap[this.cursor.row][idx] = getTextWidth(this.line().content.slice(0, idx), this.font)
                    }
                }
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
                this.updateHeight()
            }
            this.slidePointer()
        }
        
    }
    
    // overflow checks to see if the current line that the cursor is at is overflowing.
    // if so then cuts the text that is overflowing and returns it else returns an empty string.
    // it makes the assumption that only a single letter is overflowing.
    overflow(): string {
        let output = ""
        let str = this.line().content
        let width = getTextWidth(str, this.font)
        if (width > this.box.width) { // check for overflow
            let index = str.lastIndexOf(" ")
            if (index == this.lineEnd() - 1) { // if we end on a space then take the word before then
                index = str.substring(0, index).lastIndexOf(" ")
            }
            if (index === -1) { // rare case that this is all one word
                output = str.slice(str.length - 2) + output
                this.lines[this.cursor.row].content = str.substring(0, str.length - 2) + "-"
            } else {
                output = str.substring(index + 1)
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
            if (this.line().content === "") {
                this.lines.splice(this.cursor.row, 1)
                this.updateHeight()
            }
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

    // returns the current distance from the left margin to the end of the current letter
    currentWidth(): number {
        return this.widthMap[this.cursor.row][this.cursor.column]
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
        let widthSet = [0]
        this.widthMap.push(widthSet)
        this.lines.splice(this.cursor.row, 0, newLine)
        this.updateHeight()
    }

    // slidePointer moves the pointer to the current cursor position
    slidePointer(): void {
        const width = this.box.left + this.widthMap[this.cursor.row][this.cursor.column]
        const height = this.box.top + (this.cursor.row + 1) * (this.font.size + this.lineSpacing)
        this.pointer.position = new Point(width, height)
    }

    updateHeight(): void {
        if (this.lines[this.lines.length - 1].point.y != this.box.y + this.box.height) {
            this.box.height = this.lines[this.lines.length - 1].point.y - this.box.y
        }
    }
    
    move(newPos: paper.Point): void {
        let delta = this.box.topLeft.subtract(newPos)
        this.lines.forEach(line => {
            line.translate(delta)
        })
        this.pointer.translate(delta)
        this.box.topLeft = newPos
    }
    
    resize(newWidth: number): number {
        let text = this.text()
        console.log("resizing: " + text)
        this.box.width = newWidth
        this.clear()
        this.insert(text)
        return this.box.height
    }
    
    clear(): void {
        this.lines.forEach(line => {
            line.remove()
        })
        this.lines = []
        this.widthMap = []
        this.textStart()
        this.cursor.row = -1
        this.insertLine()
        this.slidePointer()
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
        this.cursor.column + " y: " + this.cursor.row + "\nat letter: " + this.currentChar() +
        "\nheight: " + this.box.height + " width: " + this.box.width
    }

}

export function getTextWidth(text: string, font: Font): number {
    // re-use canvas object for better performance
    var canvas = <HTMLCanvasElement> document.createElement("canvas");
    var context = canvas.getContext("2d");
    if (context === null) return 0;
    context.font = fontString(font)
    var metrics = context.measureText(text);
    return metrics.width;
}

type TextBoxOptions = {
    width: number, //height is inferred from the content
    content?: string,
    position?: paper.Point,
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