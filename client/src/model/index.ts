import { Header } from "./header"
import { Pos } from "fabletree/src/pos"
import { Node } from "fabletree/src/node"
import { Story, StoryEvents } from "./story"

export { Header, Story, StoryEvents }

export interface Model {

    createNode(node: Node): void

    moveNode(id: number, pos: Pos): void

    // TODO: consider using Delta from Quill instead
    editNode(id: number, text: string): void

    getNode(id: number): Node | null

    deleteNode(id: number): void

    loadStory(id: number): Promise<Story | null>

    createStory(header: Header): Promise<Story>

    deleteStory(id: number): void

    editStory(header: Header): void

    listStories(): Promise<Header[]>

}