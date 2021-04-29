import { Header } from "./header"
import { Pos, Node } from "../tree"
import { Story, StoryEvents } from "./story"
import { errors } from "./errors"
import Delta from "quill-delta"

export { Header, Story, StoryEvents, errors }

export interface Model {

    // Story Operations

    loadStory(id: number): Promise<Story | null>

    createStory(header: Header): Promise<Story>

    deleteStory(id: number): Promise<void>

    editStory(header: Header): Promise<Header>

    listStories(): Promise<Header[]>

    // Node Operatons

    newNode(node: Node): Promise<void>

    moveNode(id: number, pos: Pos): Promise<void>

    modifyNode(id: number, delta: Delta): Promise<void>

    // TODO: I'm not sure if it's necessary to load individual nodes
    // getNode(id: number): Promise<Node | null>

    deleteNode(id: number): Promise<void>

}