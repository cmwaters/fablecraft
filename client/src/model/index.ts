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

    deleteStory(id: number): Promise<void>

    editStory(header: Header): Promise<void>

    listStories(): Promise<Header[]>

    // Node Operatons

    newNode(node: Node): Promise<void>

    moveNode(id: number, pos: Pos): Promise<void>

    modifyNode(id: number, delta: Delta): Promise<void>

    getNode(id: number): Promise<Node | null>

    deleteNode(id: number): Promise<void>

}