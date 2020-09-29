import { Card } from './card'
import { Point } from 'paper'
import { Config} from './config'
import { Snippet } from './story'

const inverseScrollSpeed = 3

export class View {
    location: paper.Point
    // camera: paper.Point
    cards: Card[][] = []
    padding: paper.Size
    margin: paper.Size
    element: HTMLElement
    activeCardIdx: number = 0
    currentDepth: number = 0
    cardWidth: number = 0
    size: paper.Size
    shiftMode: boolean = false;
    
    constructor(element: HTMLElement, position: paper.Point, size: paper.Size, padding: paper.Size, margin: paper.Size, snippets: Snippet[]) {
        this.location = position;
        this.element = element;
        this.size = size;
        this.padding = padding;
        this.margin = margin
        this.cardWidth = this.calculateCardWidth()
        let cardX = (this.size.width - this.cardWidth) / 2 + this.location.x
        let cardY = this.location.y + this.padding.height + this.margin.height
        
        window.onmousewheel = (e: WheelEvent) => {
            this.shift(new Point(-e.deltaX/inverseScrollSpeed, -e.deltaY/inverseScrollSpeed))
        }
        
        let rootCards: Card[] = []
        // let's assume a flat tree and keep everything on the same x margin
        for (let i = 0; i < snippets.length; i++) {
            let newCard = new Card(this, new Point(cardX, cardY), this.cardWidth, snippets[i].text)
            cardY += newCard.box.bounds.height + this.padding.height
            rootCards.push(newCard)
        }
        this.cards.push(rootCards)
        
        document.onclick = (e: MouseEvent) => {
            this.handleClick(e)
        } 
        
        console.log(this.cards[0].length)
        this.focus(0, 0)
        console.log(this.size)
    }
    
    keydown(key: string):void {
        console.log("key down: " + key)
        if (this.card().textMode()) {
            console.log("Hello here")
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
                    console.log("Hello World")
                    if (this.shiftMode) {
                        this.createBelow()
                    } else if (this.activeCardIdx < this.cards[this.currentDepth].length - 1) {
                        this.focus(this.currentDepth, this.activeCardIdx + 1)
                    }
                    break;
                case "ArrowUp":
                    if (this.shiftMode) {
                        this.createAbove()
                    } else if (this.activeCardIdx > 0){
                        this.focus(this.currentDepth, this.activeCardIdx - 1)
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
        this.cardWidth = this.calculateCardWidth()
        console.log(this.location.y)
        let y = this.location.y + this.margin.height + this.padding.height
        for (let depth = 0; depth < this.cards.length; depth++) {
            for (let card of this.cards[depth]) {
                card.move(new Point((this.size.width - this.cardWidth) / 2 + this.location.x, y))
                let height = card.resize(this.cardWidth)
                y += (height + this.padding.height)
            }
        }
    }
    
    card(): Card {
        return this.cards[this.currentDepth][this.activeCardIdx]
    }
    
    focus(depth: number, cardIdx: number): void {
        console.log("focus on card at depth: " + depth + " and index: " + cardIdx)
        this.card().deactivate()
        if (depth >= this.cards.length || depth < 0) {
            console.log("invalid depth: " + depth)
            return
        }
        this.currentDepth = depth
        if (cardIdx >= this.cards[depth].length || cardIdx < 0) {
            console.log("invalid card index " + cardIdx + " at depth " + depth)
            return
        }
        this.activeCardIdx = cardIdx
        
        this.card().activate()
        this.center(this.currentDepth, this.activeCardIdx)
    }
    
    center(depth: number, cardIdx: number): void {
    
    }
    
    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.size.width, Config.cardWidth.min), Config.cardWidth.max)
    }
    
    up(): void {
        // if the current card is at the top then do nothing
        if (this.activeCardIdx === 0) {
            return
        }
        // else activate the card above
        this.focus(this.currentDepth, this.activeCardIdx - 1)
        let card = this.card()
        card.text.textEnd()
        card.text.slidePointer()
        card.text.activate()
    }
    
    down(): void {
        // if the current card is the last in the column then do nothing
        if (this.activeCardIdx === this.cards[this.currentDepth].length - 1) {
            return
        }
        // else move to the card below and activate it
        this.focus(this.currentDepth, this.activeCardIdx + 1)
        let card = this.card()
        card.text.textStart()
        card.text.slidePointer()
        card.text.activate()
    }

    left(): void {


    }

    right(): void {


    }

    createAbove(): void {
        console.log("create above")
        let currentCard = this.card()
        let newCard = new Card(this.project, this, currentCard.position(), this.calculateCardWidth())
        this.cards[this.currentDepth].splice(this.activeCardIdx, 0, newCard)
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
        this.cards[this.currentDepth].splice(this.activeCardIdx + 1, 0, newCard)
        this.activeCardIdx += 1
        this.card().activate()
        this.card().text.activate()
    }
    
    branch(): void {
        console.log("branch")
    }
    
    // deletes the currently active card
    deleteCard(): void {
        console.log("deleting card")
        let height = this.card().size().height
        console.log(height + this.padding.height)
        this.card().remove()
        this.cards[this.currentDepth].splice(this.activeCardIdx, 1)
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
    
    // handleClick runs the relevant logic when a click occurs inside the view. Mostly this involves passing it down
    // to the relevant card
    handleClick(e: MouseEvent): void {
        console.log("x: " + e.clientX + " y: " + e.clientY)
        let clickPoint = new Point(e.clientX, e.clientY)
        for (let depth = 0; depth < this.cards.length; depth++) {
            for (let idx = 0; idx < this.cards[depth].length; idx++) {
                if (this.cards[depth][idx].box.bounds.contains(clickPoint) && !this.cards[depth][idx].icons.contains(clickPoint)) {
                    this.focus(depth, idx)
                    this.cards[depth][idx].handleClick(clickPoint)
                }
            }
        }
    }
    
    // shift shifts the entire view by a delta vector. This is primarily
    // used to traverse along the tree an focus on different cards.
    // does not change the current depth and index
    shift(delta: paper.Point): void {
        for (let depth = 0; depth < this.cards.length; depth++) {
            for (let idx = 0; idx < this.cards[depth].length; idx++) {
                this.cards[depth][idx].translate(delta)
            }
        }
    }

    // slides the rest of the cards in the current column by delta (used for inserting or deleting or changing heights)
    slideBottom(delta: number): void {
        // if it is the last card then we have nothing to slide down
        if (this.activeCardIdx === this.cards[this.currentDepth].length -1) {
            return
        }
        for (let i = this.activeCardIdx + 1; i < this.cards[this.currentDepth].length; i++) {
            this.cards[this.currentDepth][i].translate(new Point(0, delta))
        }
    }
}