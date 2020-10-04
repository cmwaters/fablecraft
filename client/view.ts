import { Card } from './card'
import { Size, Vector, Geometry } from './types'
import { Config} from './config'
import { Snippet } from './story'

let g = Geometry
const inverseScrollSpeed = 2

export class View {
    location: Vector
    cards: Card[][] = []
    margin: Size
    element: HTMLElement
    currentIndex: number = 0
    currentDepth: number = 0
    cardWidth: number = 0
    size: Size
    shiftMode: boolean = false;
    movementInterval: NodeJS.Timeout | null = null
    currentCard: Card | null = null
    
    constructor(element: HTMLElement, snippets: Snippet[]) {
        this.element = element;
        console.log(this.element.style.width)
        this.cardWidth = this.calculateCardWidth()
        console.log(this.cardWidth)
        let cardX = (this.element.clientWidth - this.cardWidth) / 2
        let cardY = 30
        console.log("x: " + cardX)
        this.margin = Config.view.margin
        
        window.onmousewheel = (e: WheelEvent) => {
            if (this.shiftMode) {
                this.shift({x: -e.deltaY/inverseScrollSpeed, y: -e.deltaX/inverseScrollSpeed})
            } else {
                this.shift({x: -e.deltaX/inverseScrollSpeed, y: -e.deltaY/inverseScrollSpeed})
            }
        }
        
        let rootCards: Card[] = []
        // let's assume a flat tree and keep everything on the same x margin
        for (let i = 0; i < snippets.length; i++) {
            console.log(cardY)
            let newCard = new Card(this, {x: cardX, y: cardY}, this.cardWidth, snippets[i].text)
            console.log("pos: " + newCard.pos().y)
            newCard.deactivate()
            console.log(newCard.height())
            cardY += newCard.height() + this.margin.height
            rootCards.push(newCard)
        }
        this.cards.push(rootCards)
        
        element.onclick = (e: MouseEvent) => {
            this.handleClick(e)
        }
        
        console.log(this.cards[0].length)
        
        this.currentCard = this.cards[this.currentDepth][this.currentIndex]
        this.currentCard.activate()
        this.slideBottom(Config.card.toolbarHeight)
        this.center(this.currentDepth, this.currentIndex)
    }
    
    // keydown parses any input that is passed through to the view.
    keydown(key: string):void {
        console.log("key down: " + key)
        if (this.currentCard.quill.hasFocus()) {
            console.log("Hello here")
            if (key === "Escape") {
                this.currentCard.quill.blur()
            }
        } else {
            switch (key) {
                case "Shift":
                    this.shiftMode = true;
                    break;
                case "ArrowDown":
                    if (this.shiftMode) {
                        this.createBelow()
                    } else {
                        this.down()
                    }
                    break;
                case "ArrowUp":
                    if (this.shiftMode) {
                        this.createAbove()
                    } else {
                        this.up()
                    }
                    break
                case "ArrowLeft":
                    this.left()
                    break;
                case "ArrowRight":
                    if (this.shiftMode) {
                        this.branch()
                    } else {
                        this.right()
                    }
                    break
                case "Backspace":
                    this.deleteCard()
                case "Enter":
                    setTimeout(() => {
                        this.currentCard.quill.focus()
                    }, 100)
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
    
    // resize centers the object again (we may want to change the card width in the future)
    resize(): void {
        console.log("resizing")
        this.center(this.currentDepth, this.currentIndex)
    }
    
    // focus deactivates the previous card and activates a new card also centering it's position
    focus(depth: number, cardIdx: number): void {
        console.log("focus on card at depth: " + depth + " and index: " + cardIdx)
        this.currentCard.deactivate()
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
        this.currentIndex = cardIdx
        this.currentCard = this.cards[this.currentDepth][this.currentIndex]
        this.currentCard.activate()
        this.slideBottom(Config.card.toolbarHeight)
        this.center(this.currentDepth, this.currentIndex)
    }
    
    // center moves the view such that the target card is in the center of that view
    center(depth: number, cardIdx: number): void {
        if (this.movementInterval === null) {
            this.movementInterval = setInterval(() => {
                let currentPos = g.add(this.cards[depth][cardIdx].pos(), g.center({width: this.cardWidth, height: this.cards[depth][cardIdx].height()}))
                console.log("card position: " + g.string(currentPos))
                let diff = g.subtract({x: this.element.clientWidth/2, y: this.element.clientHeight/2}, currentPos)
                
                // console.log("diff" + diff)
                if (Math.abs(diff.x) < 5 && Math.abs(diff.y) < 5) {
                    this.shift(diff)
                    clearInterval(this.movementInterval)
                    this.movementInterval = null;
                } else {
                    this.shift(g.round(g.multiply(diff, 0.2)))
                }
            }, 30)
        } else {
            // we already have a previous movement job running so clear the existing one and then run this one
            clearInterval(this.movementInterval)
            this.movementInterval = null
            this.center(depth, cardIdx)
        }
    }
    
    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.element.clientWidth, Config.card.width.min), Config.card.width.max)
    }
    
    up(): void {
        // if the current card is at the top then do nothing
        if (this.currentIndex === 0) {
            return
        }
        // else activate the card above
        this.focus(this.currentDepth, this.currentIndex - 1)
    }
    
    down(): void {
        // if the current card is the last in the column then do nothing
        if (this.currentIndex === this.cards[this.currentDepth].length - 1) {
            return
        }
        // else move to the card below and activate it
        this.focus(this.currentDepth, this.currentIndex + 1)
    }

    left(): void {
        console.log("go left")
        if (this.currentCard.parentIdx !== null) {
            this.focus(this.currentDepth -1, this.currentCard.parentIdx)
        }
    }

    right(): void {
        if (this.currentCard.firstChildIdx !== null) {
            this.focus(this.currentDepth +1, this.currentCard.firstChildIdx)
        }
    }

    // createAbove creates a new card above the current once, repositioning surrounding cards, centering and activating the text
    // box of the current card. It also updates child/parent relations of other cards
    createAbove(): void {
        console.log("create above")
        let pIdx = this.currentCard.parentIdx
        let newCard = new Card(this, this.currentCard.pos(), this.calculateCardWidth())
        this.cards[this.currentDepth].splice(this.currentIndex, 0, newCard)
        this.slideBottom(newCard.height() + this.margin.height + Config.card.toolbarHeight)
        this.currentCard.deactivate()
        if (pIdx !== null) {
            this.currentCard.parentIdx = pIdx
            // update the first child and child count parameters of the parent card
            if (this.currentIndex < this.cards[this.currentDepth -1][pIdx].firstChildIdx) {
                this.cards[this.currentDepth -1][pIdx].firstChildIdx = this.currentIndex
            }
            this.cards[this.currentDepth - 1][pIdx].childrenCount++
        }
        this.center(this.currentDepth, this.currentIndex)
        newCard.activate()
        newCard.quill.focus()
        this.currentCard = newCard
    }

    // createBelow creates a new card below the current one, repositioning surrounding cards, centering and activating the text box
    // of the current card. It also updates child/parent relations of other cards
    createBelow(): void {
        console.log("create below")
        let pIdx = this.currentCard.parentIdx
        let pos = this.currentCard.pos()
        console.log(this.currentCard.height())
        console.log(pos.y + this.currentCard.height() + this.margin.height)
        let newPos = {x: pos.x, y: pos.y + this.currentCard.height() + this.margin.height}
        let newCard = new Card(this, newPos, this.cardWidth)
        this.slideBottom(newCard.height() + this.margin.height)
        this.cards[this.currentDepth].splice(this.currentIndex + 1, 0, newCard)
        this.focus(this.currentDepth, this.currentIndex + 1)
        // if the previous card had a parent we add this card as a new child of that same parent
        if (pIdx !== null) {
            newCard.parentIdx = pIdx
            // increase the children count of the parent
            this.cards[this.currentDepth - 1][pIdx].childrenCount++
        }
        newCard.quill.focus()
    }
    
    branch(): void {
        console.log("branch")
        let pIdx = this.currentIndex
        // this.currentCard.deactivate()
        if (this.currentCard.firstChildIdx === null) {
            console.log("here 1")
            // this card doesn't have any children yet
            if (this.cards.length === this.currentDepth + 1) {
                // this is the first new card of this depth
                console.log("here 2")
                let pos = g.add(this.currentCard.pos(), {x: this.cardWidth + this.margin.width, y: 0})
                console.log("pos: " + pos.x)
                this.cards.push([new Card(this, pos, this.cardWidth)])
                this.currentCard.firstChildIdx = 0;
                this.currentCard.childrenCount++;
                this.focus(this.currentDepth + 1, 0)
                this.currentCard.parentIdx = pIdx
                this.currentCard.quill.focus()
            } else {
                console.log("here 3")
                // we have to find where to insert the card
                let idx = this.childInsertionIndex()
                let pos = g.add(this.currentCard.pos(), {x: this.cardWidth + this.margin.width, y: 0})
                console.log("pos: " + pos.x)
                this.cards[this.currentDepth + 1].splice(idx, 0, new Card(this, pos, this.cardWidth))
                this.currentCard.firstChildIdx = idx
                this.currentCard.childrenCount++
                this.focus(this.currentDepth + 1, idx)
                this.currentCard.parentIdx = pIdx
                this.currentCard.quill.focus()
                // TODO: We will need to check if we are not colliding with the children cards from other parents either above us or below
            }
        } else {
            // this card already has children therefore append a new card at the bottom

        }
    }

    private childInsertionIndex(): number {
        for (let idx = this.currentIndex - 1; idx >= 0; idx--) {
            if (this.cards[this.currentDepth][idx].firstChildIdx !== null) {
                return this.cards[this.currentDepth][idx].firstChildIdx + this.cards[this.currentDepth][idx].childrenCount
            }
        }
        return 0

    }
    
    // deletes the currently active card
    deleteCard(): void {
        console.log("deleting card")
        let height = this.currentCard.height()
        console.log(height + this.margin.height)
        this.currentCard.remove()
        this.cards[this.currentDepth].splice(this.currentIndex, 1)
        this.currentIndex--
        this.slideBottom(- (height + this.margin.height))
        // TODO: add a case for when it was the last card
        if (this.cards.length === 1) {
            this.currentIndex = 0
        }
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++
        }
        this.currentCard.activate()
    }
    
    // handleClick runs the relevant logic when a click occurs inside the view. Mostly this involves passing it down
    // to the relevant card
    handleClick(e: MouseEvent): void {
        console.log("x: " + e.clientX + " y: " + e.clientY)
        let clickPoint = {x: e.clientX, y: e.clientY}
        for (let depth = 0; depth < this.cards.length; depth++) {
            for (let idx = 0; idx < this.cards[depth].length; idx++) {
                let card = this.cards[depth][idx]
                let size = {width: this.cardWidth, height: card.height()}
                if (g.inside(card.pos(), size, clickPoint)) {
                    this.focus(depth, idx)
                }
            }
        }
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
        if (this.currentIndex === this.cards[this.currentDepth].length -1) {
            return
        }
        for (let i = this.currentIndex + 1; i < this.cards[this.currentDepth].length; i++) {
            this.cards[this.currentDepth][i].translate({x: 0, y: delta})
        }
    }

    slideTop(delta: number): void {


    }
}