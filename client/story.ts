import { View } from './view'
import { Config } from './config'

const defaultSaveTime = 1000 // every second

export class Story {

    title: string
    description: string
    view: View
    // splitView: View

    // Story manages nodes in a serialized array although the individual views turn them into more of a tree
    nodes: Node[] = []
    saveInterval: number = defaultSaveTime
    header: HTMLElement // todo (eventually this should become its own class)
    
    constructor(title: string, nodes: NodeData[]) {
        this.title = title
        
        for (let i = 0; i < nodes.length; i++) {
            this.nodes.push(new Node(nodes[i]))
        }
        
        let err = this.checkTree()
        if (err !== null) {
            // TODO: deal with corrupted data
        }

        // we start with just a single view but later on we might want to encompass multiple views
        let mainViewElement = this.setupElements()
        this.view = new View(mainViewElement, this.nodes)
        
        // set up key press listeners (in the future we will split them based on what view is active)
        document.onkeydown = (e) => {
            this.view.keydown(e.key)
        }
        
        document.onkeyup = (e) => {
            this.view.keyup(e.key)
        }

        window.onresize = (e) => {
            this.view.resize()
        }

    }

    node = {
        insert(node: Node): void {
            for (let i = 0; i < this.nodes.length; i++) {
                
            }
        } 

    }

    // checkTree checks that the tree is valid. Technically we shouldn't have to do this if it is our own trusted server
    // and it is correct but during development this check will be good for my sanity
    checkTree(): string | null {
        let depth = 0;
        let index = 0;
        for (let i = 0; i < this.nodes.length; i++) { 
            let node = this.nodes[i]

            if (i === 0 && node.depth !== 0) {
                return "no root node, first node has non zero depth"
            }

            if (node.depth < depth || node.depth > depth + 1) {
                return "non incrementing depth, expected " + depth + " or 1 more but got " + node.depth
            }

            if (node.depth === depth + 1) {
                depth++
                index = 0
            }

            if (node.index !== index) {
                return "expecting node at " + index + " but instead the next node has an index of " + node.index
            }

            if (node.depth !== 0 && node.parentIndex === null) {
                return "orphan child node at depth " + node.depth + " and index " + node.index
            }

        }

        return null

    }

    // splits the view into two even views so that the user can see two different parts of the tree at once
    split(): void {
        // TODO
    }

    private setupElements(): HTMLElement {
        let headerElement = document.createElement('div')
        headerElement.style.position = "absolute"
        headerElement.id = "header"
        headerElement.style.height = Config.header.height + "px"
        headerElement.style.width = "100%";
        headerElement.innerHTML = "<h1>" + this.title + "</h1>"
        headerElement.style.backgroundColor = "#fff"
        headerElement.style.zIndex = "10";
        document.body.appendChild(headerElement)
        
        let viewElement = document.createElement('div')
        document.body.appendChild(viewElement)
        viewElement.id = "view"
        viewElement.style.width = "100%";//window.innerWidth + "px"
        viewElement.style.height = "100vh"
        viewElement.style.position = "relative"
        return viewElement
    }
    
}

// TODO id and owner to be added later
export type NodeData = {
    // _id: string
    text: string
    depth: number
    index: number
    parentIndex: number | null
    // owner: string
}

// Node represents the canonical and elemental data structure within each tree / story
export class Node {

    text: string
    depth: number
    index: number
    parentIndex: number | null
    events: Function[]

    constructor(n: NodeData) {
        this.text = n.text
        this.depth = n.depth
        this.index = n.index
        this.parentIndex = n.parentIndex
    }

    // add event fires whenever the text in the node changes. Processes can add their handlers to
    // update themselves accordingly.
    //
    // At the moment we just send what the new text is but in the future we should come up with a
    // smarter delta that represents the changes (similar to quill)
    addEvent(func: (text: string) => void): void {
        this.events.push(func)
    }

}

export type Message = {
    depth: number, 
    index: number,
    parentIndex: number | null,
    pos: number,
    deletionLength: number,
    text: string
}