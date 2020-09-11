import { Card } from './card'
import { Point, Size } from 'paper'

const minimumCardWidth = 400
const defaultViewMargin = new Size(20, 20)
const defaultViewPadding = new Size(20, 20)
export class Story {

    title: string
    description: string
    view: View
    snippets: Snippet[]
    
    constructor(title: string, snippets: Snippet[]) {
        this.title = title
        this.snippets = snippets
        this.view = new View(new Point(0, 40), new Size(document.body.clientWidth, document.body.clientHeight), 
        defaultViewPadding, defaultViewMargin, snippets)
        
        document.onkeydown = (e) => {
            this.view.input(e.key)
        }
        
        window.addEventListener('resize', () => {
            this.view.resize()
        })
    }
    
}

class View {
    location: paper.Point
    camera: paper.Point
    cards: Card[] = []
    
    padding: paper.Size
    margin: paper.Size
    activeCardIdx: number
    size: paper.Size
    
    constructor(position: paper.Point, size: paper.Size, padding: paper.Size, margin: paper.Size, snippets: Snippet[]) {
        this.location = position;
        this.size = size;
        this.padding = padding;
        this.margin = margin
        let cardWidth = Math.max(0.5 * this.size.width, minimumCardWidth)
        let cardX = (this.size.width - cardWidth) / 2 + this.location.x
        let cardY = this.location.y + this.padding.height + this.margin.height
        
        // let's assume a flat tree and keep everything on the same x margin
        snippets.forEach(snippet => {
            let newCard = new Card(new Point(cardX, cardY), cardWidth, snippet.text)
            newCard.deactivate()
            cardY += newCard.box.bounds.height + this.padding.height
            this.cards.push(newCard)
        })
        
        this.focus(0)
        console.log(this.size)
    }
    
    input(char: string):void {
        this.card().input(char)
    }
    
    resize(): void {
        // console.log("resizing")
        this.size.height = window.innerHeight
        this.size.width = window.innerWidth
        let cardWidth = Math.max(0.5 * this.size.width, minimumCardWidth)
        console.log(this.location.y)
        let y = this.location.y + this.margin.height + this.padding.height
        for (let card of this.cards) {
            console.log("y: " + y)
            console.log("x: " + (this.size.width - cardWidth) / 2 + this.location.x + cardWidth/2)
            card.move(new Point((this.size.width - cardWidth) / 2 + this.location.x + cardWidth/2, y))
            let height = card.resize(cardWidth)
            console.log("height: " + height)
            y += (height + this.padding.height)
        }
    }
    
    card(): Card {
        return this.cards[this.activeCardIdx]
    }
    
    focus(cardIdx: number): void {
        this.activeCardIdx = cardIdx
        this.card().activate()
    }
}

export type Snippet = {
    text: string
    depth: number
    index: number
}