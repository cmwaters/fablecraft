import { Header } from "../header"
import { Pos } from "fabletree"
import { Node } from "fabletree"
import { Story } from "../story"
import { Model } from ".."
import Delta from "quill-delta"

import localforage from "localforage"
import { errors } from "../errors"
import { encode, decode } from "./encoder"
import { op, Operation } from "./operation"

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

        // set the null value for the header
        this.header = {
            uid: 0,
            title: "Untitled",
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

        // save the previously locked header
        if (this.header.uid !== header.uid) {
            await this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)
        }

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

        // check if we are loading a new story
        if (this.header.uid !== id) {
            // save the previously locked header
            await this.stories.setItem(JSON.stringify(this.header.uid), this.header)

            // load the new header
            let header = await this.stories.getItem<Header>(JSON.stringify(id))
    
            if (header === null) {
                throw new Error(errors.storyNotFound(id))
            }

            // lock on to the new header
            this.lockStory(header)
        }

        let nodes = await this.updateState()

        return { 
            header: this.header,
            nodes: nodes,
        }
        
    }


    async editStory(header: Header): Promise<void> {
        this.lockStory(header)

        await this.stories.setItem<string>(JSON.stringify(header.uid), JSON.stringify(header))
    }

    deleteStory(id: number): Promise<void> {
        return this.stories.removeItem(JSON.stringify(id))
    }

    listStories(): Promise<Header[]> {
        let stories: Header[] = []
        return new Promise<Header[]>((resolve, reject) => {
            this.stories.iterate<Header, void>((value: Header, key: string, iterationNumber: number) => {
                console.log(value)
                stories.push(value)
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
    private nextHeight(): string {
        this.header.latestHeight++
        return encode(this.header.latestHeight)
    }

    private encodeNode(node: Node): string {
        return JSON.stringify(node)
    }

    private decodeNode(nodeString: string): Node {
        let nodeType = JSON.parse(nodeString) as Node
        return {
            uid: nodeType.uid,
            pos: Object.assign(new Pos, nodeType.pos),
            content: Object.assign(new Delta, nodeType.content)
        }
    }

    async newNode(node: Node): Promise<void> {    
        console.log("new node at height " + this.header.latestHeight)        
        await this.history.setItem<Operation>(this.nextHeight(), op.new(node))
    }

    async moveNode(id: number, pos: Pos): Promise<void> {
        console.log("move node")
        await this.history.setItem<Operation>(this.nextHeight(), op.move(id, pos))
    }

    async modifyNode(id: number, delta: Delta): Promise<void> {
        console.log("modify node " + JSON.stringify(delta))
        console.log(this.header.latestHeight)
        await this.history.setItem<Operation>(this.nextHeight(), op.modify(id, delta))
    }

    async getNode(id: number): Promise<Node | null> {
        let nodeString = await this.state.getItem<string>(JSON.stringify(id))

        if (nodeString === null) {
            return Promise.reject(errors.nodeNotFound(id))
        }

        return JSON.parse(nodeString) as Node
    }

    async deleteNode(id: number): Promise<void> {
        await this.history.setItem<Operation>(this.nextHeight(), op.delete(id))
    }

    // Private helper operations

    private lockStory(header: Header): void {
        // set the header
        this.header = header
        
        // check if the header is already locked
        if (this.header.uid == header.uid) {
            return
        }

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
        let height = 0

        return new Promise<Node[]>((resolve, reject) => {
            this.history.iterate<Operation, void>((op: Operation, key: string, iterationNumber: number) => {
                height = decode(key)
                console.log("Height: " + height)
                console.log("Iteration: " + iterationNumber)
                if (height === this.header.stateHeight + 1) {
                    switch (op.type) {
                        case "modify":
                            console.log("processing modify node")
                            let modifiedNode = nodes[op.uid]
                            let delta = Object.assign(new Delta, op.delta)
                            delta.ops.forEach(op => op = Object.assign(Delta.Op, op))
                            console.log(modifiedNode.content)
                            modifiedNode.content = modifiedNode.content.compose(delta)
                            console.log(modifiedNode.content)
                            this.state!.setItem<Node>(JSON.stringify(modifiedNode.uid), modifiedNode)
                                .catch((err: any) => reject(err))
                            break;
    
                        case "new":
                            console.log("processing new node")
                            let node = {
                                uid: op.node.uid,
                                pos: Object.assign(new Pos, op.node.pos),
                                content: Object.assign(new Delta, op.node.content)
                            }
                            this.state!.setItem<Node>(JSON.stringify(node.uid), node)
                                .catch((err: any) => reject(err))
                            nodes.push(node)
                            break;
    
                        case "delete":
                            console.log("processing delete node " + op.uid)
                            this.state.removeItem(JSON.stringify(op.uid))
                                .catch((err: any) => reject(err))
                            nodes[op.uid].pos = Pos.null()
                            break;
    
                        case "move":
                            console.log("processing move node")
                            let movedNode = nodes[op.uid]
                            movedNode.pos = Object.assign(new Pos, op.pos)
                            this.state!.setItem<Node>(JSON.stringify(movedNode.uid), movedNode)
                                .catch((err: any) => reject(err))
                            break;
                    }
                    
                    this.header.stateHeight++
                    this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)
                        .catch((err: any) => reject(err))
                }
            }, (err: any, result: void) => {
                if (err) {
                    return reject(err)
                }
                console.log("updated state. Last height " + height)
                if (height != this.header.latestHeight) {
                    this.header.latestHeight = height
                    this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)
                        .catch((err: any) => reject(err))
                }

                nodes = this.removeDeletedNodes(nodes)
                    
                return resolve(nodes)
            })
        })

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

    private removeDeletedNodes(nodes: Node[]): Node[] {
        console.log("removing deleted nodes...")
        for (let i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].pos.isNull()) {
                console.log(i)
                console.log(nodes[i])
                nodes.splice(i, 1)
                console.log(nodes)
            }
        }
        return nodes
    }

}

