import { Node, Pos } from "./node"

export type Events = {
    // onNewCard is triggered whenever the user
    // creates a new card
    onNewCard: (pos: Pos) => void

    // onMoveCard is triggered when the user moves
    // a card to a new location. It does not trigger for
    // all the other cards that have been shuffled around to
    // faciliate the move.
    onMoveCard: (oldPos: Pos, newPos: Pos) => void

    // onModifyCard is triggered everytime the text in that
    // card is updated.
    onModifyCard: (node: Node) => void

    // onDeleteCard is triggered when a user deletes a card. Note
    // this event only occurs once and not for every child card that
    // is deleted in the process.
    onDeleteCard: (node: Node) => void
}