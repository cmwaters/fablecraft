import { Point, Size } from 'paper'
import { View } from './view'

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
            this.view.keydown(e.key)
        }
        
        document.onkeyup = (e) => {
            this.view.keyup(e.key)
        }
        
        // automatically resize to the entire screen. When we have multiple views we will
        // need to change this.
        window.addEventListener('resize', () => {
            this.view.resize(new Size(window.innerWidth,window.innerHeight))
        })
    }
    
}

// TODO id and owner to be added later
export type Snippet = {
    // _id: string
    text: string
    depth: number
    index: number
    parentIndex: number | null
    // owner: string
}