import { Card } from './card'
import { Point } from 'paper'
import { Config} from './config'
import { Snippet } from './story'

const inverseScrollSpeed = 3

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
        
        document.onmousewheel = (e: WheelEvent) => {
            this.shift(new Point(-e.deltaX/inverseScrollSpeed, -e.deltaY/inverseScrollSpeed))
        }
        
        // let's assume a flat tree and keep everything on the same x margin
        for (let i = 0; i < snippets.length; i++) {
            let newCard = new Card(this.project, this, new Point(cardX, cardY), cardWidth, snippets[i].text)
            cardY += newCard.box.bounds.height + this.padding.height
            // newCard.box.onMouseEnter = () => {
                
            //     // alert("Hello World")
            // }
            newCard.box.onClick = (e) => {
                console.log("me x: " + e.clientX + " y: " + e.clientY)
                this.focus(i)
            }
            this.cards.push(newCard)
        }
        
        document.onclick = (e: MouseEvent) => {
            this.handleClick(e)
        } 
        
        this.focus(0)
        console.log(this.size)
    }
    
    keydown(key: string):void {
        
        if (this.card().textMode()) {
            if (key === "Escape") {
                this.card().text.deactivate()
            } else {
                let initialHeight = this.card().box.bounds.height
                this.card().input(key)
                let delta = this.card().box.bounds.height - initialHeight
                if (delta !== 0) {
                    this.slideBottom(delta)
                }
            }
        } else {
            switch (key) {
                case "Shift":
                    this.shiftMode = true;
                    break;
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
                case "Backspace":
                    this.deleteCard()
                case "Enter":
                    this.card().text.activate()
                    break;
                default:
                    break; //nop
            }
        }
    }
    
    // most things are done on key down but for combinations that require holding a key we
    // use this key up to check when the operation is over
    keyup(key: string): void {
        switch (key) {
        case "Shift":
            this.shiftMode = false;
            break
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
    
    up(): void {
        this.focus(this.activeCardIdx - 1)
        let card = this.card()
        card.text.textEnd()
        card.text.slidePointer()
        card.text.activate()
    }
    
    down(): void {
        this.focus(this.activeCardIdx + 1)
        let card = this.card()
        card.text.textStart()
        card.text.slidePointer()
        card.text.activate()
    }

    createAbove(): void {
        console.log("create above")
        let currentCard = this.card()
        let newCard = new Card(this.project, this, currentCard.position(), this.calculateCardWidth())
        this.cards.splice(this.activeCardIdx, 0, newCard)
        this.slideBottom(newCard.size().height + this.padding.height)
        currentCard.deactivate()
        newCard.activate()
        this.card().text.activate()
    }

    createBelow(): void {
        console.log("create below")
        let currentCard = this.card()
        currentCard.deactivate()
        let newPos = currentCard.position().add(new Point(0, currentCard.size().height + this.padding.height))
        let newCard = new Card(this.project, this, newPos, this.calculateCardWidth())
        this.slideBottom(newCard.size().height + this.padding.height)
        this.cards.splice(this.activeCardIdx + 1, 0, newCard)
        this.activeCardIdx += 1
        this.card().activate()
        this.card().text.activate()
    }
    
    branch(): void {
        console.log("branch")
    }
    
    deleteCard(): void {
        console.log("deleting card")
        let height = this.card().size().height
        console.log(height + this.padding.height)
        this.card().remove()
        this.cards.splice(this.activeCardIdx, 1)
        this.activeCardIdx--
        this.slideBottom(- (height + this.padding.height))
        // TODO: add a case for when it was the last card
        if (this.cards.length === 1) {
            this.activeCardIdx = 0
        }
        if (this.activeCardIdx < this.cards.length - 1) {
            this.activeCardIdx++
        }
        this.card().activate()
    }
    
    handleClick(e: MouseEvent): void {
        console.log("x: " + e.clientX + " y: " + e.clientY)
        let clickPoint = new Point(e.clientX, e.clientY)
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].box.bounds.contains(clickPoint) && !this.cards[i].icons.contains(clickPoint)) {
                this.focus(i)
                this.cards[i].handleClick(clickPoint)
            }
        }
    }
    
    // shift shifts the entire view by a delta vector. This is primarily
    // used to traverse along the tree an focus on different cards.
    shift(delta: paper.Point): void {
        this.cards.forEach(card => {
            card.translate(delta)
        })
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