import { Header } from "./header"
import { Pos } from "fabletree/src/pos"
import { Node } from "fabletree/src/node"
import { Story } from "./story"
import { Model } from "."
import localforage from "localforage"

const dbName = "fable"

export class LocalStorage implements Model {
    stories: LocalForage
    current: LocalForage | undefined

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

    createStory(header: Header): Promise<void> {
        return this.stories.setItem<string>(header.uid.toString(), JSON.stringify(header))
            .then(value => { return })
            .catch(err => { return Promise.reject(new Error(err)) })
    }

    getStory(id: number): Promise<Story | null> {
        return this.stories.getItem<string>(id.toString())
            .then(value => {
                if (!value) {
                    return null
                }
                return JSON.parse(value) as Story
            }).catch((err) => {
                return Promise.reject(err)
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
                stories.push(JSON.parse(value) as Header)
            }).catch(err => {
                reject(err)
            })
            resolve(stories)
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