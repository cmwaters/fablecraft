import { Header } from "./header"
import { Pos } from "fabletree/src/pos"
import { Node } from "fabletree/src/node"
import { Story, StoryEvents } from "./story"
import Delta from "quill-delta"

export { Header, Story, StoryEvents }

export interface Model {

    // Story Operations

    loadStory(id: number): Promise<Story | null>

    createStory(header: Header): Promise<Story>

    deleteStory(id: number): void

    editStory(header: Header): void

    listStories(): Promise<Header[]>

    // Node Operatons

    newNode(node: Node): void

    moveNode(id: number, pos: Pos): void

    modifyNode(id: number, delta: Delta): void

    getNode(id: number): Node | null

    deleteNode(id: number): void

}