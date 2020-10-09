import { View } from './view'
import { Config } from './config'
import Axios from 'axios'

const defaultSaveTime = 1000 // every second

export class Story {

    title: string
    description: string
    token: string
    id: string
    view: View
    // splitView: View

    // Story manages nodes in a serialized array although the individual views turn them into more of a tree
    nodes: Node[] = []
    depthSizes: number[] = []
    saveInterval: number = defaultSaveTime
    header: HTMLElement // todo (eventually this should become its own class)
    
    constructor(title: string, nodes: NodeData[], token: string, id: string) {
        this.title = title
        this.token = token
        this.id = id
        
        for (let i = 0; i < nodes.length; i++) {
            this.nodes.push(new Node(nodes[i]))
        }
        
        let err = this.checkTree()
        if (err !== null) {
            // TODO: deal with corrupted data
        }

        // we start with just a single view but later on we might want to encompass multiple views
        let mainViewElement = this.setupElements()
        this.view = new View(mainViewElement, this.nodes, this)
        
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

    insert(node: Node): void {
        console.log("inserting node to server")
        console.log(this.token)
        let idx = this.getNodePos(node.depth, node.index)
        this.nodes.splice(idx, 0, node)
        Axios.get("/api/story/" + this.id, { params: { token: this.token } })
            .then(function (response) {
                console.log(response.data.story);
            })
            .catch(function (error) {
                console.log(error);
            });

        Axios.post("/api/story/" + this.id +  "/card", node.data(), { params: { token: this.token }})
            .then(function (response) {
                console.log(response.data);
            })
            .catch(function (error) {
                console.log(error);
            });
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
                this.depthSizes.push(node.index)
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

        this.depthSizes.push(this.nodes[this.nodes.length -1].index)

        return null
    }

    private getNodePos(depth: number, index: number): number {
        let pos = 0;
        for (let i = 0; i < depth; i++) {
            pos += this.depthSizes[i]
        }
        return pos + index
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
    events: Function[] = []

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

    data(): NodeData {
        return {text: this.text, depth: this.depth, index: this.index, parentIndex: this.parentIndex}
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