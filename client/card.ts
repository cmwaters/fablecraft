import { TextBox } from './text'
import { Point, Size, Path, Rectangle, Color } from 'paper'

const defaultMargin = new Size(15, 15)

export class Card {
    text: TextBox
    box: paper.Path.Rectangle
    margin: paper.Size
    
    constructor(pos: paper.Point, width: number, content?: string, margin?: paper.Size) {
        margin === undefined ? this.margin = defaultMargin: this.margin = margin
        this.text = new TextBox({
            position: new Point(pos.x + this.margin.width, pos.y + this.margin.height),
            width: width - (2 * this.margin.width),
            content: content
        })
        console.log("textbox: " + this.text.string())
        let height = this.text.box.height + (2 * this.margin.height)
        let rect = new Rectangle(pos, new Size(width, height))
        this.box = new Path.Rectangle(rect, new Size(3, 3))
        this.box.strokeColor = new Color(0.8, 0.8, 0.8, 1)
    }
    
    input(char: string): void {
        this.text.input(char)
        if (this.text.box.height + (2 * this.margin.height) !== this.box.bounds.height ) {
            this.box.bounds.height = this.text.box.height + (2 * this.margin.height)
        }
    }
    
    // resize changes the width of the current card which may result in a reshuffling of the 
    // text and a new height which is returned
    resize(newWidth: number): number {
        this.box.bounds.width = newWidth
        return this.text.resize(newWidth - (2 * this.margin.width)) + (2 * this.margin.height)
    }
    move(newPos: paper.Point): void {
        console.log(newPos)
        this.box.position = newPos.add(new Point(0, this.box.bounds.height/2))
        this.text.move(this.box.position.add(new Point(this.margin.width - this.box.bounds.width/2, this.margin.height - this.box.bounds.height/2)))
    }
    
    translate(delta: paper.Point): void {
        
    }
    
    activate(): void {
        this.text.pointer.visible = true;
    }
    
    deactivate(): void {
        this.text.pointer.visible = false;
    }

}

