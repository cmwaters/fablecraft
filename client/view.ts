import { Card } from './card'
import { Size, Vector } from './types'
import { Config} from './config'
import { Snippet } from './story'

const inverseScrollSpeed = 3

export class View {
    location: Vector
    cards: Card[][] = []
    padding: Size
    element: HTMLElement
    activeCardIdx: number = 0
    currentDepth: number = 0
    cardWidth: number = 0
    size: Size
    shiftMode: boolean = false;
    
    constructor(element: HTMLElement, snippets: Snippet[]) {
        this.element = element;
        console.log(this.element.style.width)
        this.cardWidth = this.calculateCardWidth()
        console.log(this.cardWidth)
        let cardX = (this.element.clientWidth - this.cardWidth) / 2
        let cardY = 30
        console.log("x: " + cardX)
        this.padding = Config.view.padding
        
        window.onmousewheel = (e: WheelEvent) => {
            this.shift({x: -e.deltaX/inverseScrollSpeed, y: -e.deltaY/inverseScrollSpeed})
        }
        
        let rootCards: Card[] = []
        // let's assume a flat tree and keep everything on the same x margin
        for (let i = 0; i < snippets.length; i++) {
            let newCard = new Card(this, 0, {x: cardX, y: cardY}, this.cardWidth, snippets[i].text)
            cardY += newCard.height() + this.padding.height
            rootCards.push(newCard)
        }
        this.cards.push(rootCards)
        
        document.onclick = (e: MouseEvent) => {
            this.handleClick(e)
        } 
        
        // console.log(this.cards[0].length)
        // this.focus(0, 0)
        // console.log(this.size)
    }
    
    keydown(key: string):void {
        console.log("key down: " + key)
        if (this.card().quill.hasFocus()) {
            console.log("Hello here")
            if (key === "Escape") {
                this.card().quill.blur()
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
                    this.card().quill.focus()
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
    
    // resize(newSize: paper.Size): void {
    //     this.size = newSize
    //     this.cardWidth = this.calculateCardWidth()
    //     console.log(this.location.y)
    //     let y = this.location.y + this.margin.height + this.padding.height
    //     for (let depth = 0; depth < this.cards.length; depth++) {
    //         for (let card of this.cards[depth]) {
    //             card.move(new Point((this.size.width - this.cardWidth) / 2 + this.location.x, y))
    //             let height = card.resize(this.cardWidth)
    //             y += (height + this.padding.height)
    //         }
    //     }
    // }
    
    card(): Card {
        return this.cards[this.currentDepth][this.activeCardIdx]
    }
    
    focus(depth: number, cardIdx: number): void {
        console.log("focus on card at depth: " + depth + " and index: " + cardIdx)
        this.card().deactivate()
        this.slideBottom(-Config.card.toolbarHeight)
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
        this.slideBottom(Config.card.toolbarHeight)
        this.center(this.currentDepth, this.activeCardIdx)
    }
    
    center(depth: number, cardIdx: number): void {
    
    }
    
    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.element.clientWidth, Config.card.width.min), Config.card.width.max)
    }
    
    up(): void {
        // if the current card is at the top then do nothing
        if (this.activeCardIdx === 0) {
            return
        }
        // else activate the card above
        this.focus(this.currentDepth, this.activeCardIdx - 1)
    }
    
    down(): void {
        // if the current card is the last in the column then do nothing
        if (this.activeCardIdx === this.cards[this.currentDepth].length - 1) {
            return
        }
        // else move to the card below and activate it
        this.focus(this.currentDepth, this.activeCardIdx + 1)
    }

    left(): void {


    }

    right(): void {


    }

    createAbove(): void {
        console.log("create above")
        let currentCard = this.card()
        let newCard = new Card(this, this.cards[0].length, currentCard.pos(), this.calculateCardWidth())
        this.cards[this.currentDepth].splice(this.activeCardIdx, 0, newCard)
        this.slideBottom(newCard.height() + this.padding.height + Config.card.toolbarHeight)
        currentCard.deactivate()
        newCard.activate()
        newCard.quill.focus()
    }

    createBelow(): void {
        console.log("create below")
        let currentCard = this.card()
        currentCard.deactivate()
        let pos = currentCard.pos()
        console.log(currentCard.height())
        console.log(pos.y + currentCard.height() + this.padding.height)
        let newPos = {x: pos.x, y: pos.y + currentCard.height() + this.padding.height}
        let newCard = new Card(this, this.cards[0].length, newPos, this.cardWidth)
        this.slideBottom(newCard.height() + this.padding.height)
        this.cards[this.currentDepth].splice(this.activeCardIdx + 1, 0, newCard)
        this.activeCardIdx += 1
        newCard.activate()
        newCard.quill.focus()
    }
    
    branch(): void {
        console.log("branch")
    }
    
    // deletes the currently active card
    deleteCard(): void {
        console.log("deleting card")
        let height = this.card().height()
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
        // console.log("x: " + e.clientX + " y: " + e.clientY)
        // let clickPoint = new Point(e.clientX, e.clientY)
        // for (let depth = 0; depth < this.cards.length; depth++) {
        //     for (let idx = 0; idx < this.cards[depth].length; idx++) {
        //         if (this.cards[depth][idx].box.bounds.contains(clickPoint) && !this.cards[depth][idx].icons.contains(clickPoint)) {
        //             this.focus(depth, idx)
        //             this.cards[depth][idx].handleClick(clickPoint)
        //         }
        //     }
        // }
    }
    
    // shift shifts the entire view by a delta vector. This is primarily
    // used to traverse along the tree an focus on different cards.
    // does not change the current depth and index
    shift(delta: Vector): void {
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
            this.cards[this.currentDepth][i].translate({x: 0, y: delta})
        }
    }
}