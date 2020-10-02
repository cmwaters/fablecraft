import { Point, Size } from 'paper'
import { View } from './view'
import { Config } from './config'
import { view } from 'paper/dist/paper-core'

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
        // we start with just a single view but later on we might want to encompass multiple views
        let headerElement = document.createElement('div')
        headerElement.id = "header"
        headerElement.style.height = Config.header.height + "px"
        headerElement.innerHTML = "<h1>" + this.title + "</h1>"
        document.body.appendChild(headerElement)
        
        let viewElement = document.createElement('div')
        document.body.appendChild(viewElement)
        viewElement.id = "view"
        viewElement.style.width = "100%";//window.innerWidth + "px"
        viewElement.style.height = "calc(100% - " + Config.header.height + "px)"
        viewElement.style.position = "relative"
        this.view = new View(viewElement, snippets)
        
        document.onkeydown = (e) => {
            this.view.keydown(e.key)
        }
        
        document.onkeyup = (e) => {
            this.view.keyup(e.key)
        }
        
        // automatically resize to the entire screen. When we have multiple views we will
        // need to change this.
        // window.addEventListener('resize', () => {
        //     this.view.resize(new Size(window.innerWidth,window.innerHeight))
        // })
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