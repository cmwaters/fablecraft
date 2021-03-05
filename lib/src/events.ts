import { Node } from "./node"
import { Pos } from "./pos"

export type Events = {
    // onNewNode is triggered whenever the user
    // creates a new card
    onNewNode: (pos: Pos) => void

    // onMoveNode is triggered when the user moves
    // a card to a new location. It does not trigger for
    // all the other cards that have been shuffled around to
    // facilitate the move.
    onMoveNode: (oldPos: Pos, newPos: Pos) => void

    // onModifyNode is triggered every time the text in that
    // card is updated.
    onModifyNode: (node: Node) => void

    // onDeleteNode is triggered when a user deletes a card. Note
    // this event only occurs once and not for every child card that
    // is deleted in the process.
    onDeleteNode: (node: Node) => void

    // onSelectNode is triggered whenever a new node is selected by
    // the user.
    onSelectNode: (node: Node) => void
}