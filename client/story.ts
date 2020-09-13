import { Point, Size } from 'paper'
import { View } from './view'

const defaultViewMargin = new Size(20, 20)
const defaultViewPadding = new Size(20, 20)
export class Story {

    title: string
    description: string
    view: View
    snippets: Snippet[]
    project: paper.Project
    
    constructor(title: string, project: paper.Project, snippets: Snippet[]) {
        this.title = title
        this.snippets = snippets
        this.project = project
        this.view = new View(this.project, new Point(0, 40), new Size(document.body.clientWidth, document.body.clientHeight), 
        defaultViewPadding, defaultViewMargin, snippets)
        
        document.onkeydown = (e) => {
            this.view.input(e.key)
        }
        
        window.addEventListener('resize', () => {
            this.view.resize()
        })
    }
    
}

export type Snippet = {
    text: string
    depth: number
    index: number
}