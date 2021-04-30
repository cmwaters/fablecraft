import { Node, Pos } from "../../tree"
import Delta from "quill-delta"

export type Operation = ModifyOperation | NewOperation | MoveOperation | DeleteOperation

export type ModifyOperation = {
    type: "modify"
    uid: number
    delta: Delta
}

export type NewOperation = {
    type: "new"
    node: Node
}
export type DeleteOperation = {
    type: "delete"
    uid: number
}
export type MoveOperation = {
    type: "move"
    uid: number,
    pos: Pos
}

export const op = {
    new: (node: Node): NewOperation => {
        return {
            type: "new",
            node: node
        }
    },

    modify: (uid: number, delta: Delta): ModifyOperation => {
        return {
            type: "modify",
            uid: uid,
            delta: delta
        }
    },

    delete: (uid: number): DeleteOperation => {
        return {
            type: "delete",
            uid: uid
        }
    },

    move: (uid: number, pos: Pos): MoveOperation => {
        return {
            type: "move",
            uid: uid,
            pos: pos,
        }
    }
}
