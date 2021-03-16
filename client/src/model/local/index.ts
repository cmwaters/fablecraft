import { Header } from "../header"
import { Pos } from "fabletree"
import { Node } from "fabletree"
import { Story } from "../story"
import { Model } from ".."
import Delta from "quill-delta"
import localforage from "localforage"
import { errors } from "../errors"
import { Op, Operation } from "./operation"

const dbName = "fable"
const statePrefix = "state"
const historyPrefix = "history"

export class LocalStorage implements Model {
    stories: LocalForage
    state: LocalForage
    history: LocalForage
    header: Header

    constructor() {
        this.stories = localforage.createInstance({
            name: dbName,
            storeName: "stories"
        })

        this.header = {
            uid: 0,
            title: "",
            description: "",
            latestHeight: 0,
            stateHeight: 0,
        }

        // create instances to track the state and history of the story
        this.state = localforage.createInstance({
            name: dbName,
            storeName: statePrefix + this.header.uid.toString(),
        })

        this.history = localforage.createInstance({
            name: dbName,
            storeName: historyPrefix + this.header.uid.toString(),
        })
    }

    // Story Operations

    async createStory(header: Header): Promise<Story> {

        this.lockStory(header)

        // create a new header
        await this.stories.setItem<Header>(JSON.stringify(header.uid), header)

        // create the first node and save it in the db
        let firstNode: Node = {
            uid: 0,
            pos: new Pos(),
            content: new Delta()
        }
        await this.state.setItem<Node>(JSON.stringify(firstNode.uid), firstNode)

        // return the story
        return {
            header: this.header,
            nodes: [firstNode],
        }

    }

    async loadStory(id: number): Promise<Story | null> {

        let header = await this.stories.getItem<Header>(JSON.stringify(id))

        if (header === null) {
            throw new Error(errors.storyNotFound(id))
        }

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
        await this.history.setItem(JSON.stringify(this.header.latestHeight), JSON.stringify(Op.new(node)))
        this.header.latestHeight++
    }

    async moveNode(id: number, pos: Pos): Promise<void> {
        await this.history.setItem(JSON.stringify(this.header.latestHeight), JSON.stringify(Op.move(id, pos)))
        this.header.latestHeight++
    }

    async modifyNode(id: number, delta: Delta): Promise<void> {
        await this.history.setItem(JSON.stringify(this.header.latestHeight), JSON.stringify(Op.modify(id, delta)))
        this.header.latestHeight++
    }

    async getNode(id: number): Promise<Node | null> {
        let nodeString = await this.state.getItem<string>(JSON.stringify(id))

        if (nodeString === null) {
            return Promise.reject(errors.nodeNotFound(id))
        }

        return JSON.parse(nodeString) as Node
    }

    async deleteNode(id: number): Promise<void> {
        await this.history.setItem(JSON.stringify(this.header.latestHeight), JSON.stringify(Op.delete(id)))
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
        let nodes = await this.getState()

        // check if already up to date
        if (this.header.stateHeight === this.header.latestHeight) {
            return nodes
        }

        await this.history.iterate<string, void>( async (value: string, key: string, iterationNumber: number) => {
            let height = JSON.parse(key) as number
            if (height === this.header.stateHeight + 1) {
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
                
                this.header.stateHeight++
                await this.stories.setItem(this.header.uid.toString(), JSON.stringify(this.header))
            }
        })

        return nodes
    }

    private async getState(): Promise<Node[]> {
        if (!this.state) {
            throw new Error(errors.noStoryLocked)
        }

        let nodes: Node[] = []

        await this.state!.iterate<Node, void>((value: Node, key: string, iterationNumber: number) => {
            let node = {
                uid: value.uid,
                pos: Object.assign(new Pos, value.pos),
                content: Object.assign(new Delta, value.content),
            }

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

