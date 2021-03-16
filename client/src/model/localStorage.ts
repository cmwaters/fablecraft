import { Header } from "./header"
import { Pos } from "fabletree"
import { Node } from "fabletree"
import { Story } from "./story"
import { Model } from "."
import Delta from "quill-delta"
import localforage from "localforage"
import { errors } from "./errors"

const dbName = "fable"
const statePrefix = "state"
const historyPrefix = "history"

export class LocalStorage implements Model {
    stories: LocalForage

    // to be set when a story is loaded
    state: LocalForage | undefined
    history: LocalForage | undefined
    header: Header | undefined

    constructor() {
        this.stories = localforage.createInstance({
            name: dbName,
            storeName: "stories"
        })
    }

    // Story Operations

    async createStory(header: Header): Promise<Story> {
        // create a new header
        await this.stories.setItem<string>(header.uid.toString(), JSON.stringify(header))

        this.lockStory(header)

        // create the first node and save it in the db
        let firstNode: Node = {
            uid: 0,
            pos: new Pos(),
            content: new Delta()
        }
        await this.newNode(firstNode)

        // return the story
        return {
            header: header,
            nodes: [firstNode],
        }

    }

    async loadStory(id: number): Promise<Story | null> {

        let headerString = await this.stories.getItem<string>(id.toString())

        if (headerString === null) {
            throw new Error(errors.storyNotFound(id))
        }

        let header = JSON.parse(headerString) as Header

        this.lockStory(header)

        let nodes = await this.updateState()

        return { 
            header: header,
            nodes: nodes,
        }
        
    }


    async editStory(header: Header): Promise<void> {
        await this.stories.setItem<string>(header.uid.toString(), JSON.stringify(header))

        if (this.header === undefined || header.uid !== this.header.uid) {
            this.header = header
            this.state = localforage.createInstance({
                name: dbName,
                storeName: header.uid.toString(),
            })
        }
    }

    deleteStory(id: number): Promise<void> {
        return this.stories.removeItem(id.toString())
    }

    listStories(): Promise<Header[]> {
        let stories: Header[] = []
        return new Promise<Header[]>((resolve, reject) => {
            this.stories.iterate<string, void>((value: string, key: string, iterationNumber: number) => {
                let header = JSON.parse(value) as Header
                console.log(header)
                stories.push(header)
            }, (err: any, result: void) => {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(stories)
                }
            })
        })
    }

    // Node Operations

    async newNode(node: Node): Promise<void> {
        if (!this.history || !this.header) {
            return Promise.reject(errors.noStoryLocked)
        }
            
        await this.history.setItem(JSON.stringify(this.header!.latestHeight), JSON.stringify(Op.new(node)))

        this.header.latestHeight++
    }

    async moveNode(id: number, pos: Pos): Promise<void> {
        if (!this.history || !this.header) {
            return Promise.reject(errors.noStoryLocked)
        }

        await this.history.setItem(JSON.stringify(id), JSON.stringify(Op.move(id, pos)))

        this.header.latestHeight++
    }

    async modifyNode(id: number, delta: Delta): Promise<void> {
        if (!this.history || !this.header) {
            return Promise.reject(errors.noStoryLocked)
        }

        await this.history.setItem(JSON.stringify(id), JSON.stringify(Op.modify(id, delta)))

        this.header.latestHeight++
    }

    async getNode(id: number): Promise<Node | null> {
        if (!this.state || !this.header) {
            return Promise.reject(errors.noStoryLocked)
        }

        let nodeString = await this.state.getItem<string>(JSON.stringify(id))

        if (nodeString === null) {
            return Promise.reject(errors.nodeNotFound(id))
        }

        return JSON.parse(nodeString) as Node
    }

    async deleteNode(id: number): Promise<void> {
        if (!this.history || !this.header) {
            return Promise.reject(errors.noStoryLocked)
        }

        await this.history.setItem(JSON.stringify(id), JSON.stringify(Op.delete(id)))

        this.header.latestHeight++
    }

    // Private helper operations

    private lockStory(header: Header): void {
        // set the header
        this.header = header

        // create instances to track the state and history of the story
        this.state = localforage.createInstance({
            name: dbName,
            storeName: statePrefix + header.uid.toString(),
        })

        this.history = localforage.createInstance({
            name: dbName,
            storeName: historyPrefix + header.uid.toString(),
        })

    }

    private async updateState(): Promise<Node[]> {
        if (!this.header || !this.history || !this.state) {
            return []
        }

        let nodes = await this.getState()

        await this.history.iterate<string, void>( async (value: string, key: string, iterationNumber: number) => {
            let height = JSON.parse(key) as number
            if (height === this.header!.stateHeight + 1) {
                let op = JSON.parse(value) as Operation
                switch (op.type) {
                    case "modify":
                        let modifiedNode = nodes[op.uid]
                        modifiedNode.content.transform(op.delta)
                        await this.state!.setItem(JSON.stringify(modifiedNode.uid), JSON.stringify(modifiedNode))
                        break;

                    case "new":
                        await this.state!.setItem(JSON.stringify(op.node.uid), JSON.stringify(op.node))
                        nodes.push(op.node)
                        break;

                    case "delete":
                        await this.state!.removeItem(JSON.stringify(op.uid))
                        nodes = nodes.splice(op.uid, 1)
                        break;

                    case "move":
                        let movedNode = nodes[op.uid]
                        movedNode.pos = op.pos
                        break;

                }
                
                this.header!.stateHeight++
                await this.stories.setItem(this.header!.uid.toString(), JSON.stringify(this.header))
            }
        })

        return nodes
    }

    private async getState(): Promise<Node[]> {
        if (!this.state) {
            throw new Error(errors.noStoryLocked)
        }

        let nodes: Node[] = []

        await this.state!.iterate<string, void>((value: string, key: string, iterationNumber: number) => {
            let node = JSON.parse(value) as Node
            nodes.push(node)
        }, (err: any, result: void) => {
            if (err) {
                throw new Error(err)
            }
            return
        })

        return nodes
    }

}

type Operation = ModifyOperation | NewOperation | MoveOperation | DeleteOperation

type ModifyOperation = {
    type: "modify"
    uid: number
    delta: Delta
}

type NewOperation = {
    type: "new"
    node: Node
}
type DeleteOperation = {
    type: "delete"
    uid: number
}
type MoveOperation = {
    type: "move"
    uid: number,
    pos: Pos
}

const Op = {
    new: (node: Node): NewOperation => {
        return { 
            type: "new",
            node: node
        }
    },

    modify: (uid: number, delta: Delta): ModifyOperation => {
        return { 
            type: "modify",
            uid: uid,
            delta: delta
        }
    },

    delete: (uid: number): DeleteOperation => {
        return { 
            type: "delete",
            uid: uid
        }
    },

    move: (uid: number, pos: Pos): MoveOperation => {
        return { 
            type: "move",
            uid: uid,
            pos: pos,
        }
    }
}
