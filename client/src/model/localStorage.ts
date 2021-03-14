import { Header } from "./header"
import { Pos } from "fabletree"
import { Node } from "fabletree"
import { Story } from "./story"
import { Model } from "."
import localforage from "localforage"

const dbName = "fable"

export class LocalStorage implements Model {
    stories: LocalForage
    current: LocalForage | undefined
    header: Header | undefined

    constructor() {
        this.stories = localforage.createInstance({
            name: dbName,
            storeName: "stories"
        })
    }

    createNode(node: Node): void {

    }

    moveNode(id: number, pos: Pos): void {

    }

    editNode(id: number, text: string): void {

    }

    getNode(id: number): Node | null {
        return null
    }

    deleteNode(id: number): void {

    }

    async createStory(header: Header): Promise<Story> {
        // create a new header
        await this.stories.setItem<string>(header.uid.toString(), JSON.stringify(header))

        // create an instance to track the cards of this header
        this.current = localforage.createInstance({
            name: dbName,
            storeName: header.uid.toString(),
        })

        // create the first node and save it in the db
        let firstNode: Node = {
            uid: 0,
            pos: new Pos(),
            text: ""
        }
        await this.createNode(firstNode)

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
            this.stories.getItem<string>(id.toString())
            .then(headerString => {
                if (!headerString) {
                    return resolve(null)
                }
                this.header = JSON.parse(headerString) as Header
                this.current = localforage.createInstance({
                    name: dbName,
                    storeName: this.header.uid.toString(),
                })

                let nodes: Node[] = []
                this.current.iterate<string, void>((value: string, key: string, iterationNumber: number) => {
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


    editStory(header: Header): void {

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

    testSet(key: string, value: string): void {
        this.stories.setItem(key, value)
            .catch(err => console.error(err))
        return
    }

    async testGet(key: string): Promise<string | null> {
        return await this.stories.getItem(key)
    }

}