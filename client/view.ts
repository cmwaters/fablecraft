import { Card } from './card'
import { Point } from 'paper'
import { Config} from './config'
import { Snippet } from './story'

export class View {
    location: paper.Point
    camera: paper.Point
    cards: Card[] = []
    project: paper.Project
    padding: paper.Size
    margin: paper.Size
    activeCardIdx: number = 0
    size: paper.Size
    shiftMode: boolean = false;
    
    constructor(project: paper.Project, position: paper.Point, size: paper.Size, padding: paper.Size, margin: paper.Size, snippets: Snippet[]) {
        this.location = position;
        this.size = size;
        this.project = project
        this.padding = padding;
        this.margin = margin
        let cardWidth = this.calculateCardWidth()
        let cardX = (this.size.width - cardWidth) / 2 + this.location.x
        let cardY = this.location.y + this.padding.height + this.margin.height
        
        // let's assume a flat tree and keep everything on the same x margin
        for (let i = 0; i < snippets.length; i++) {
            let newCard = new Card(this.project, this, new Point(cardX, cardY), cardWidth, snippets[i].text)
            cardY += newCard.box.bounds.height + this.padding.height
            newCard.box.onMouseEnter = () => {
                
                // alert("Hello World")
            }
            newCard.box.onClick = () => {
                this.focus(i)
            }
            this.cards.push(newCard)
        }
        
        this.focus(0)
        console.log(this.size)
    }
    
    input(char: string):void {
        if (this.card().textMode()) {
            if (char === "Escape") {
                this.card().text.decativate()
            } else {
                let initialHeight = this.card().box.bounds.height
                this.card().input(char)
                let delta = this.card().box.bounds.height - initialHeight
                if (delta !== 0) {
                    this.slideBottom(delta)
                }
            }
        } else {
            switch (char) {
                case "Shift":
                    this.shiftMode = true
                case "ArrowDown":
                    if (this.shiftMode) {
                        this.createBelow()
                    } else if (this.activeCardIdx < this.cards.length - 1) {
                        this.focus(this.activeCardIdx + 1)
                    }
                    break;
                case "ArrowUp":
                    if (this.shiftMode) {
                        this.createAbove()
                    } else if (this.activeCardIdx > 0){
                        this.focus(this.activeCardIdx - 1)
                    }
                    break
                case "Enter":
                    this.card().text.activate()
                    break;
                default:
                    break; //nop
            }
        }
    }
    
    resize(newSize: paper.Size): void {
        this.size = newSize
        let cardWidth = this.calculateCardWidth()
        console.log(this.location.y)
        let y = this.location.y + this.margin.height + this.padding.height
        for (let card of this.cards) {
            card.move(new Point((this.size.width - cardWidth) / 2 + this.location.x, y))
            let height = card.resize(cardWidth)
            y += (height + this.padding.height)
        }
    }
    
    card(): Card {
        return this.cards[this.activeCardIdx]
    }
    
    focus(cardIdx: number): void {
        this.card().deactivate()
        this.activeCardIdx = cardIdx
        this.card().activate()
    }
    
    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.size.width, Config.cardWidth.min), Config.cardWidth.max)
    }

    createAbove(): void {
        console.log("create above")
    }

    createBelow(): void {


    }
    
    // shift shifts the entire view by a delta vector. This is primarily
    // used to traverse along the tree an focus on different cards.
    shift(delta: paper.Point): void {
    
    }

    slideBottom(delta: number): void {
        if (this.activeCardIdx === this.cards.length -1) {
            return
        }
        for (let i = this.activeCardIdx + 1; i < this.cards.length; i++) {
            this.cards[i].translate(new Point(0, delta))
        }
    }
}