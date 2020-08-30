import { Rectangle, Point, PointText } from 'paper'
import paper from 'paper'

export class TextBox{
    _class: string = "TextBox"
    
    text: string
    box: paper.Rectangle
    parsedText: paper.PointText[]
    cursor: TextPos
    fontFamily: string //TODO: parse into own font class
    fontSize: string
    fontWeight: string
    position: paper.Point
    size: paper.Size
    
    constructor(content: string, position: paper.Point, size: paper.Size) {
        this.size = size
        // this.content = content
        // this.lines.push(content)
        this.fontSize = "30px"
    }
    

}

type TextPos = {
    row: number,
    column: number
}