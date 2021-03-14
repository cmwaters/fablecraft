import { Header } from "./header"
import { Node, Events, Pos } from "fabletree"

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
        onMoveNode: (oldPos: Pos, newPos: Pos) => {},
        onModifyNode: (node: Node) => {},
        onDeleteNode: (node: Node) => {},
        onSelectNode: (node: Node) => {},
    }
}