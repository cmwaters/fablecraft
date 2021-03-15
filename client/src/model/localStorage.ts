import { Header } from "./header"
import { Pos } from "fabletree"
import { Node } from "fabletree"
import { Story } from "./story"
import { Model } from "."
import Delta from "quill-delta"
import localforage from "localforage"
import { resolve } from "../../webpack.config"

const dbName = "fable"
const nodePrefix = "node"
const historyPrefix = "history"

export class LocalStorage implements Model {
    stories: LocalForage

    // to be set when a story is loaded
    nodes: LocalForage | undefined
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

        // create an instance to track the cards of this header
        this.nodes = localforage.createInstance({
            name: dbName,
            storeName: nodePrefix + header.uid.toString(),
        })

        // create the first node and save it in the db
        let firstNode: Node = {
            uid: 0,
            pos: new Pos(),
            content: ""
        }
        await this.newNode(firstNode)

        this.history = localforage.createInstance({
            name: dbName,
            storeName: historyPrefix + header.uid.toString(),
        })

        // set the header
        this.header = header

        // return the story
        return {
            header: header,
            nodes: [firstNode],
        }

    }

    loadStory(id: number): Promise<Story | null> {
        return new Promise<Story | null>((resolve, reject) => {
            
            // get story header
            this.stories.getItem<string>(id.toString())
                .then(headerString => {
                    if (!headerString) {
                        return resolve(null)
                    }
                    this.header = JSON.parse(headerString) as Header
                    this.nodes = localforage.createInstance({
                        name: dbName,
                        storeName: this.header.uid.toString(),
                    })

                    // iterate through the stories nodes
                    let nodes: Node[] = []
                    this.nodes.iterate<string, void>((value: string, key: string, iterationNumber: number) => {
                        let node = JSON.parse(value) as Node
                        nodes.push(node)
                    }, (err: any, result: void) => {
                        if (err) {
                            return reject(err)
                        } else {
                            return resolve({
                                header: this.header!,
                                nodes: nodes,
                            })
                        }
                    })

                }).catch((err) => {
                    return reject(err)
                })
        })
    }


    async editStory(header: Header): Promise<void> {
        await this.stories.setItem<string>(header.uid.toString(), JSON.stringify(header))

        if (this.header === undefined || header.uid !== this.header.uid) {
            this.header = header
            this.nodes = localforage.createInstance({
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

    newNode(node: Node): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.history) {
                return reject("no story is currently set")
            }
            
            this.history.setItem(node.uid.toString(), JSON.stringify(node))
                .then(value => resolve())
                .catch(err => reject(err))
        })
    }

    moveNode(id: number, pos: Pos): void {
        
    }

    modifyNode(id: number, delta: Delta): void {

    }

    getNode(id: number): Node | null {
        return null
    }

    deleteNode(id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.nodes) {
                return reject("no story is currently set")
            }

            this.nodes.removeItem(id.toString())
                .then(value => resolve())
                .catch(err => reject(err))
        })
    }

    // Test Operations

    testSet(key: string, value: string): void {
        this.stories.setItem(key, value)
            .catch(err => console.error(err))
        return
    }

    async testGet(key: string): Promise<string | null> {
        return await this.stories.getItem(key)
    }

}

type Operation = ModifyOperation | NewOperation | MoveOperation | DeleteOperation

type ModifyOperation = Delta
type NewOperation = {
    uid: number,
    pos: Pos
}
type DeleteOperation = {
    uid: number
}
type MoveOperation = {
    uid: number,
    fromPos: Pos,
    toPos: Pos,
}