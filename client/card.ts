import { TextBox } from './text'
import { Point, Size, Path, Rectangle, Color } from 'paper'

const defaultMargin = new Size(10, 10)

export class Card {
    text: TextBox
    box: paper.Path.Rectangle

    constructor(pos: paper.Point, size: paper.Size, margin?: paper.Size) {
        let rect = new Rectangle(pos, size)
        if (margin === undefined)
            margin = defaultMargin
        this.box = new Path.Rectangle(rect, new Size(3, 3))
        this.box.strokeColor = new Color('black')
        this.text = new TextBox({
            position: new Point(pos.x + margin.width, pos.y + margin.height),
            size: new Size(size.width - (2 * margin.width), size.height - (2 * margin.height)),
        })
    }

}

