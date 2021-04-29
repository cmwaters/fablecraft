import { Header } from "./header"
import { Node, Events, Pos } from "../tree"
import Delta from "quill-delta"

export type Story = {
    header: Header,
    nodes: Node[]
}

export type StoryEvents = {
    onTitleChange?: (newTitle: string) => void,
    nodes?: Events
}

export function fillEvents(events: StoryEvents): StoryEvents {
    if (events.onTitleChange === undefined) {
        events.onTitleChange = (newTitle: string) => {}
    }

    if (events.nodes === undefined) {
        events.nodes = emptyNodeEvents()
    }

    return events
}

export function emptyNodeEvents(): Events {
    return { 
        onNewNode: (uid: number, pos: Pos) => {},
        onMoveNode: (uid: number, oldPos: Pos, newPos: Pos) => {},
        onModifyNode: (uid: number, delta: Delta) => {},
        onDeleteNode: (node: Node) => {},
        onSelectNode: (node: Node) => {},
    }
}

// export class UserStory implements Story {
//     header: Header,
//     node: Node[],
// }