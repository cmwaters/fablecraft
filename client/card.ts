import { TextBox } from './text'
import { Point, Size, Path, Rectangle, Color, Project } from 'paper'
import ArrowDown from './icons/box-arrow-in-down.svg' 

const defaultMargin = new Size(15, 15)
const defaultBarHeight = 30
const iconClearance = 2

export class Card {
    text: TextBox
    box: paper.Path.Rectangle
    bar: paper.Path.Line
    margin: paper.Size
    icon: paper.Path.Rectangle
    project: paper.Project
    
    
    constructor(project: paper.Project, pos: paper.Point, width: number, content?: string, margin?: paper.Size) {
        this.project = project
        margin === undefined ? this.margin = defaultMargin: this.margin = margin
        this.text = new TextBox({
            position: new Point(pos.x + this.margin.width, pos.y + this.margin.height),
            width: width - (2 * this.margin.width),
            content: content
        })
        console.log("textbox: " + this.text.string())
        let height = this.text.box.height + (2 * this.margin.height)
        this.bar = new Path.Line(new Point(pos.x, pos.y + height), new Point(pos.x + width, pos.y + height))
        this.bar.strokeColor = new Color(0.8, 0.8, 0.8, 1)
        this.bar.visible = false;
        let rect = new Rectangle(pos, new Size(width, height + defaultBarHeight))
        this.box = new Path.Rectangle(rect, new Size(3, 3))
        this.box.strokeColor = new Color(0.8, 0.8, 0.8, 1)
        this.box.visible = false;
        // this.icon = new Path.Rectangle(new Rectangle(new Point(pos.x + iconClearance, pos.y + this.text.box.height + (this.margin.height * 2) + iconClearance), new Size(defaultBarHeight - (2 * iconClearance), defaultBarHeight - (2 * iconClearance))), new Size(3, 3))
        // this.icon.strokeColor = new Color(0.9, 0.9, 0.9, 1)

        // let item = new paper.Item()
        // this.project.importSVG(ArrowDown, {
        //     onLoad: (item: any) => {
        //         item.scale(20)
        //         item.position = this.icon.position
        //         item.fillColor = new Color('black')
        //         console.log("Hello World")
        //     }
        // })

    }
    
    input(char: string): void {
        this.text.input(char)
        if (this.text.box.height + (2 * this.margin.height) + defaultBarHeight !== this.box.bounds.height ) {
            this.box.bounds.height = this.text.box.height + (2 * this.margin.height) + defaultBarHeight
            this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
        }
    }
    
    // resize changes the width of the current card which may result in a reshuffling of the 
    // text and a new height which is returned
    resize(newWidth: number): number {
        this.box.bounds.width = newWidth
        this.bar.bounds.width = newWidth
        return this.text.resize(newWidth - (2 * this.margin.width)) + (2 * this.margin.height)
    }

    move(newPos: paper.Point): void {
        console.log(newPos)
        this.box.position = newPos.add(new Point(0, this.box.bounds.height/2))
        this.bar.position.y = this.box.position.y + (this.box.bounds.height)/2 - defaultBarHeight
        this.bar.position.x = this.box.position.x
        this.text.move(this.box.position.add(new Point(this.margin.width - this.box.bounds.width/2, this.margin.height - this.box.bounds.height/2)))
    }
    
    translate(delta: paper.Point): void {
        this.box.translate(delta)
        this.bar.translate(delta)
        this.text.translate(delta)
    }

    activate(): void {
        this.box.visible = true;
        this.bar.visible = true;
    }

    deactivate(): void {
        this.box.visible = false;
        this.bar.visible = false;
    }

    textMode(): boolean {
        return this.text.pointer.visible
    }

}

