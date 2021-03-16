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

    async newNode(node: Node): Promise<void> {    
        this.header.latestHeight++
        console.log("new node")        
        await this.history.setItem<Operation>(JSON.stringify(this.header.latestHeight), Op.new(node))
    }

    async moveNode(id: number, pos: Pos): Promise<void> {
        this.header.latestHeight++
        console.log("move node")
        await this.history.setItem<Operation>(JSON.stringify(this.header.latestHeight), Op.move(id, pos))
    }

    async modifyNode(id: number, delta: Delta): Promise<void> {
        this.header.latestHeight++
        console.log("modify node " + JSON.stringify(delta))
        console.log(this.header.latestHeight)
        await this.history.setItem<Operation>(JSON.stringify(this.header.latestHeight), Op.modify(id, delta))
    }

    async getNode(id: number): Promise<Node | null> {
        let nodeString = await this.state.getItem<string>(JSON.stringify(id))

        if (nodeString === null) {
            return Promise.reject(errors.nodeNotFound(id))
        }

        return JSON.parse(nodeString) as Node
    }

    async deleteNode(id: number): Promise<void> {
        this.header.latestHeight++
        await this.history.setItem<Operation>(JSON.stringify(this.header.latestHeight), Op.delete(id))
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
        await this.history.iterate<Operation, void>( async (op: Operation, key: string, iterationNumber: number) => {
            height = JSON.parse(key) as number
            console.log("Height: " + height)
            if (height === this.header.stateHeight + 1) {
                switch (op.type) {
                    case "modify":
                        console.log("d monidy")
                        let modifiedNode = nodes[op.uid]
                        let delta = Object.assign(new Delta, op.delta)
                        console.log(op.delta)
                        modifiedNode.content.transform(delta)
                        await this.state!.setItem<Node>(JSON.stringify(modifiedNode.uid), modifiedNode)
                        break;

                    case "new":
                        let node = {
                            uid: op.node.uid,
                            pos: Object.assign(new Pos, op.node.pos),
                            content: Object.assign(new Delta, op.node.content)
                        }
                        await this.state!.setItem<Node>(JSON.stringify(node.uid), node)
                        nodes.push(node)
                        break;

                    case "delete":
                        await this.state.removeItem(JSON.stringify(op.uid))
                        nodes = nodes.splice(op.uid, 1)
                        break;

                    case "move":
                        let movedNode = nodes[op.uid]
                        movedNode.pos = Object.assign(new Pos, op.pos)
                        await this.state!.setItem<Node>(JSON.stringify(movedNode.uid), movedNode)
                        break;
                }
                
                this.header.stateHeight++
                await this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)
            }
            return undefined
        })
        this.header.latestHeight = height
        await this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)

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

