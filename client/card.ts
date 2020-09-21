import { TextBox } from './text'
import { Point, Size, Path, Rectangle, Color, Project, Group } from 'paper'
import ArrowDown from './icons/box-arrow-in-down.svg' 
import ArrowUp from './icons/box-arrow-in-up.svg' 
import Trash from './icons/trash.svg'
import Share from './icons/share.svg'
import { View } from './view'

const defaultMargin = new Size(15, 15)
const defaultBarHeight = 30
const iconClearance = 12
const iconSize = 20

export class Card {
    text: TextBox
    box: paper.Path.Rectangle
    bar: paper.Path.Line
    // potentially margin can be just one number.
    margin: paper.Size
    icons: paper.Group
    project: paper.Project
    view: View
    
    // The following might not be necessary and managed by the view
    parent: Card | null = null
    children: Card[] = []
    
    constructor(project: paper.Project, view: View, pos: paper.Point, width: number, content?: string, margin?: paper.Size) {
        this.project = project
        this.view = view
        margin === undefined ? this.margin = defaultMargin: this.margin = margin
        let rect = new Rectangle(pos, new Size(width, 2 * this.margin.height + defaultBarHeight))
        this.box = new Path.Rectangle(rect, new Size(3, 3))
        this.box.strokeColor = new Color('white')
        this.box.fillColor = new Color("white")
        // this.box.visible = false;
        this.text = new TextBox({
            position: new Point(pos.x + this.margin.width, pos.y + this.margin.height),
            width: width - (2 * this.margin.width),
            content: content
        })
        let height = this.text.box.height + (2 * this.margin.height)
        this.box.bounds.height = height + defaultBarHeight
        this.bar = new Path.Line(new Point(pos.x, pos.y + height), new Point(pos.x + width, pos.y + height))
        this.bar.strokeColor = new Color(0.8, 0.8, 0.8, 1)
        this.bar.visible = false;

        let icons = [
            {img: ArrowDown, y: 3, func: () => {this.view.createBelow()}},
            {img: ArrowUp, y: 8, func: () => {this.view.createAbove()}},
            {img: Trash, y: 6, func: () => {this.view.deleteCard()}},
            {img: Share, y: 6, func: () => {this.view.branch()}},
        ]
        this.icons = new Group()
        
        for (let i = 0; i < icons.length; i++) {
            this.project.importSVG(icons[i].img, {
                onLoad: (item: paper.Item) => {
                    item.scale(iconSize)
                    item.position = new Point(pos.x + iconClearance + ((iconClearance + iconSize) * i) + iconSize / 2, 
                    pos.y + this.text.box.height + (this.margin.height * 2) + icons[i].y + iconSize / 2)
                    item.fillColor = new Color(0.8, 0.8, 0.8, 1)
                    item.onMouseEnter = () => {
                        item.fillColor = new Color(0.2, 0.2, 0.2, 1)
                    }
                    item.onMouseLeave = () => {
                        item.fillColor = new Color(0.8, 0.8, 0.8, 1)
                    }
                    item.onClick = () => {
                        icons[i].func()
                    }
                    this.icons.addChild(item)
                }
            })
        }
        this.icons.visible = false; 

    }
    
    // input handles keyboard inputs directed to this card
    input(char: string): void {
        if (this.text.text() === "" && char == "Backspace") {
            this.view.deleteCard()
        } else if (this.text.cursor.row === 0 && char === "ArrowUp") {
            // move up to the next card if we have reached the top of this
            this.view.up()
        } else if (this.text.lastLine() && char === "ArrowDown") {
            // move down to the card below if we have reached the bottom of this
            this.view.down()
        } else {
            this.text.input(char)
            if (this.text.box.height + (2 * this.margin.height) + defaultBarHeight !== this.box.bounds.height ) {
                this.box.bounds.height = this.text.box.height + (2 * this.margin.height) + defaultBarHeight
                this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
                this.icons.position.y = this.bar.position.y + this.icons.bounds.height / 2 + 3
            }
        }
    }
    
    // resize changes the width of the current card which may result in a reshuffling of the 
    // text and a new height which is returned
    resize(newWidth: number): number {
        this.box.bounds.width = newWidth
        this.bar.bounds.width = newWidth
        this.box.bounds.height = this.text.resize(newWidth - (2 * this.margin.width)) + (2 * this.margin.height) + defaultBarHeight
        this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
        this.icons.position.y = this.bar.position.y + this.icons.bounds.height / 2 + 3
        return this.box.bounds.height
    }

    move(newPos: paper.Point): void {
        let delta = newPos.subtract(this.position())
        this.translate(delta)
    }
    
    position(): paper.Point {
        return this.box.position.subtract(new Point(this.box.bounds.width/2, this.box.bounds.height/2)) 
    }
    
    size(): paper.Size {
        return new Size(this.box.bounds.width, this.box.bounds.height)
    }
    
    translate(delta: paper.Point): void {
        this.box.translate(delta)
        this.bar.translate(delta)
        this.text.translate(delta)
        this.icons.translate(delta)
    }

    activate(): void {
        this.box.strokeColor = new Color(0.8, 0.8, 0.8, 1);
        this.bar.visible = true;
        this.icons.visible = true;
    }

    deactivate(): void {
        this.box.strokeColor = new Color("white");
        this.bar.visible = false;
        this.icons.visible = false;
        this.text.deactivate()
    }
    
    remove(): void {
        this.box.remove()
        this.bar.remove()
        this.icons.remove()
        this.text.remove()
    }

    textMode(): boolean {
        return this.text.pointer.visible
    }
    
    handleClick(pos: paper.Point): void {
        console.log(pos)
        if (this.text.box.contains(pos)) {
            this.text.activate()
            console.log("clicked on text")
            this.text.setCursorPos(pos)
        }
    }

}

