import { TextBox } from './text'
import { Point, Size, Path, Rectangle, Color } from 'paper'

const defaultMargin = new Size(10, 10)

export class Card {
    text: TextBox
    box: paper.Path.Rectangle
    margin: paper.Size
    

    constructor(pos: paper.Point, size: paper.Size, margin?: paper.Size) {
        let rect = new Rectangle(pos, size)
        margin === undefined ? this.margin = defaultMargin: this.margin = margin
        this.box = new Path.Rectangle(rect, new Size(3, 3))
        this.box.strokeColor = new Color('black')
        this.text = new TextBox({
            position: new Point(pos.x + this.margin.width, pos.y + this.margin.height),
            width: size.width - (2 * this.margin.width),
        })
    }
    
    input(char: string): void {
        this.text.input(char)
        if (this.text.box.height + this.margin.height > this.box.bounds.height ) {
            this.box.bounds.height = this.text.box.height + this.margin.height
        }
    }

}

