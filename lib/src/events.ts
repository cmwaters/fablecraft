import { Node } from "./node"
import { Pos } from "./pos"
import Delta from "quill-delta"

export type Events = {
    // onNewNode is triggered whenever the user
    // creates a new card
    onNewNode?: (uid: number, pos: Pos) => void

    // onMoveNode is triggered when the user moves
    // a card to a new location. It does not trigger for
    // all the other cards that have been shuffled around to
    // facilitate the move.
    onMoveNode?: (uid: number, oldPos: Pos, newPos: Pos) => void

    // onModifyNode is triggered every time the text in that
    // card is updated.
    onModifyNode?: (uid: number, delta: Delta) => void

    // onDeleteNode is triggered when a user deletes a card. Note
    // this event only occurs once and not for every child card that
    // is deleted in the process.
    onDeleteNode?: (node: Node) => void

    // onSelectNode is triggered whenever a new node is selected by
    // the user.
    onSelectNode?: (node: Node) => void
}