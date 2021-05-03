import { Header } from "../header"
import { Pos, Node } from "../../tree"
import { Story } from "../story"
import { Model } from ".."
import Delta from "quill-delta"
import winston from "winston"
import localforage from "localforage"
import { errors } from "../errors"
import { encode, decode } from "./encoder"
import { op, Operation } from "./operation"

const dbName = "fable"
const statePrefix = "state"
const historyPrefix = "history"

const nullHeader = {
    uid: -1,
    title: "",
    description: "",
    latestHeight: 0,
    stateHeight: 0,
    lastUpdated: Date.now(),
}

export type Options = {
    logger?: winston.Logger
}

export class LocalStorage implements Model {
    stories: LocalForage
    state: LocalForage
    history: LocalForage
    header: Header
    logger?: winston.Logger

    constructor(opts?: Options) {
        this.stories = localforage.createInstance({
            name: dbName,
            storeName: "stories"
        })

        if (opts && opts.logger) {
            this.logger = opts.logger
        }

        // set the null value for the header
        this.header = nullHeader

        // create instances to track the state and history of the story
        this.state = localforage.createInstance({
            name: dbName,
            storeName: statePrefix + this.header.uid.toString(),
        })

        this.history = localforage.createInstance({
            name: dbName,
            storeName: historyPrefix + this.header.uid.toString(),
        })

        if (this.logger) this.logger.info("starting instance of local storage")
    }

    // Story Operations

    async createStory(header: Header): Promise<Story> {
        if (this.logger) this.logger.debug("creating story " + header.title + " with id " + header.uid) 

        // check if it is not the first header
        if (this.header.uid !== -1) {
            if (this.header.uid == header.uid) {
                throw new Error(errors.storyAlreadyExists(header.uid))
            } 
    
            let checkHeader = await this.stories.getItem<Header>(JSON.stringify(header.uid))
            if (checkHeader) {
                throw new Error(errors.storyAlreadyExists(header.uid))
            }
            
            // save the old header
            await this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)
        }

        this.checkNonNegativeID(header.uid)

        header.lastUpdated = Date.now()
        this.lockStory(header)

        // create a new header
        await this.stories.setItem<Header>(JSON.stringify(header.uid), header)

        // create the first node and save it in the db
        let firstNode: Node = {
            uid: 0,
            pos: new Pos(),
            content: new Delta()
        }
        await this.state.setItem<Node>(encode(firstNode.uid), firstNode)

        if (this.logger) this.logger.info("created new story " + header.title + " with id " + header.uid)
        // return the story
        return {
            header: this.header,
            nodes: [firstNode],
        }

    }

    async loadStory(id: number): Promise<Story | null> {
        if (this.logger) this.logger.debug("loading story " + id)

        this.checkNonNegativeID(id)

        // check if we are loading a new story
        if (this.header.uid !== id) {
            // save the previously locked header
            if (this.header.uid !== -1) {
                await this.stories.setItem(JSON.stringify(this.header.uid), this.header)
            }

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

    async editStory(header: Header): Promise<Header> {
        if (this.logger) this.logger.debug("editing story " + header.uid)

        if (this.header.uid === -1) {
            throw new Error(errors.storyNotFound(header.uid))
        }

        if (this.header.uid !== header.uid) {
            // save the previously locked header
            await this.stories.setItem(JSON.stringify(this.header.uid), this.header)

            let oldHeader = await this.stories.getItem<Header>(JSON.stringify(header.uid))
            if (oldHeader === null) {
                throw new Error(errors.storyNotFound(header.uid))
            }
            this.lockStory(oldHeader)
        }

        this.header.title = header.title
        this.header.description = header.description

        await this.stories.setItem<string>(JSON.stringify(header.uid), JSON.stringify(header))

        return this.header
    }

    async deleteStory(id: number): Promise<void> {
        if (this.logger) this.logger.debug("deleting story " + id)

        this.checkNonNegativeID(id)

        if (this.header.uid !== id) {
            // save the previously locked header
            await this.stories.setItem(JSON.stringify(this.header.uid), this.header)

            // retrieve the header to be deleted and lock on it
            let header = await this.stories.getItem<Header>(JSON.stringify(id))
            if (header === null) {
                throw new Error(errors.storyNotFound(id))
            }
            this.lockStory(header)
        }

        await this.state.clear()

        await this.history.clear()

        await this.stories.removeItem(JSON.stringify(id))

        this.lockStory(nullHeader)
    }

    listStories(): Promise<Header[]> {
        let stories: Header[] = []
        return new Promise<Header[]>((resolve, reject) => {
            this.stories.iterate<Header, void>((value: Header, key: string, iterationNumber: number) => {
                console.log(key)
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
        if (this.logger) this.logger.debug("new node " + node.uid + " at height " + this.header.latestHeight)
        if (this.header.uid === -1 ) {
            throw new Error(errors.noStoryLocked)
        }   
        await this.history.setItem<Operation>(this.nextHeight(), op.new(node))
    }

    async moveNode(id: number, pos: Pos): Promise<void> {
        if (this.logger) this.logger.debug("moving node " + id + " at height " + this.header.latestHeight)
        if (this.header.uid === -1) {
            throw new Error(errors.noStoryLocked)
        }
        await this.history.setItem<Operation>(this.nextHeight(), op.move(id, pos))
    }

    async modifyNode(id: number, delta: Delta): Promise<void> {
        if (this.logger) this.logger.debug("modifying node " + id + " at height " + this.header.latestHeight)
        if (this.header.uid === -1) {
            throw new Error(errors.noStoryLocked)
        }
        await this.history.setItem<Operation>(this.nextHeight(), op.modify(id, delta))
    }

    async deleteNode(id: number): Promise<void> {
        if (this.logger) this.logger.debug("deleting node " + id + " at height " + this.header.latestHeight)

        if (this.header.uid === -1) {
            throw new Error(errors.noStoryLocked)
        }

        await this.history.setItem<Operation>(this.nextHeight(), op.delete(id))
    }

    // Private helper operations

    private nextHeight(): string {
        this.header.latestHeight++
        this.header.lastUpdated = Date.now()
        return encode(this.header.latestHeight)
    }

    private lockStory(header: Header): void {
        // check if the header is already locked
        if (this.header.uid == header.uid) {
            return
        }

        // set the header
        this.header = header

        if (this.logger) this.logger.debug("locking story " + header.uid)

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
        let originalHeight = this.header.stateHeight

        return new Promise<Node[]>((resolve, reject) => {
            this.history.iterate<Operation, void>((op: Operation, key: string, iterationNumber: number) => {
                height = decode(key)
                if (this.logger) this.logger.debug("updating state: " + height)
                if (height === this.header.stateHeight + 1) {
                    switch (op.type) {
                        case "modify":
                            if (this.logger) this.logger.debug("processing modify op on node " + op.uid)
                            let modifiedNode = nodes[op.uid]
                            if (modifiedNode === undefined) {
                                if (this.logger) this.logger.error("node to be modified with id " + op.uid + " not found. Delta: " + op.delta.toString())
                                break
                            }
                            let delta = Object.assign(new Delta, op.delta)
                            delta.ops.forEach(op => op = Object.assign(Delta.Op, op))
                            modifiedNode.content = modifiedNode.content.compose(delta)
                            this.state.setItem<Node>(encode(modifiedNode.uid), modifiedNode)
                                .catch((err: any) => reject(err))
                            break;
    
                        case "new":
                            if (this.logger) this.logger.debug("processing new op on node " + op.node.uid)
                            let node = {
                                uid: op.node.uid,
                                pos: Object.assign(new Pos, op.node.pos),
                                content: Object.assign(new Delta, op.node.content)
                            }
                            this.state.setItem<Node>(encode(node.uid), node)
                                .catch((err: any) => reject(err))
                            nodes.push(node)
                            break;
    
                        case "delete":
                            if (this.logger) this.logger.debug("processing delete op on node " + op.uid)
                            this.state.removeItem(encode(op.uid))
                                .catch((err: any) => reject(err))
                            nodes[op.uid].pos = Pos.null()
                            nodes[op.uid].content = new Delta()
                            break;
    
                        case "move":
                            if (this.logger) this.logger.debug("processing move op on node " + op.uid)
                            let movedNode = nodes[op.uid]
                            if (movedNode === undefined) { 
                                if (this.logger) this.logger.error("node to be moved with id " + op.uid + " not found")
                            }

                            movedNode.pos = Object.assign(new Pos, op.pos)
                            this.state!.setItem<Node>(encode(movedNode.uid), movedNode)
                                .catch((err: any) => reject(err))
                            break;
                    }
                    
                    this.header.stateHeight++ 
                    this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)
                        .catch((err: any) => reject(err))
                }
            }, (err: any, result: void) => {
                if (err) {
                    if (this.logger) this.logger.error("update state: " + err.toString())
                    return reject(err)
                }
                if (height != this.header.latestHeight) {
                    this.header.latestHeight = height
                    this.stories.setItem<Header>(JSON.stringify(this.header.uid), this.header)
                    .catch((err: any) => reject(err))
                }
                
                if (this.logger) this.logger.info("updated state from height " + originalHeight + " to " + height)
                return resolve(this.fill(nodes))
            })
        })

    }

    private fill(nodes: Node[]): Node[] {
        for (let i = 0; i < nodes.length; i++) {
            while (nodes[i].uid !== i) {
                nodes.splice(i, 0, {
                    uid: i,
                    pos: Pos.null(),
                    content: new Delta(),
                })
            }
        }
        return nodes
    }

    private async getState(): Promise<Node[]> {
        if (this.logger) this.logger.debug("getting state")

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

    private checkNonNegativeID(id: number) {
        if (id < 0) {
            throw new Error(errors.negativeID(id))
        }
    }

}

