import { Pos } from "./node"

export type Events = {
    onNewCard: (pos: Pos) => void
    onMoveCard: (oldPos: Pos, newPos: Pos) => void
    onModifyCard: (node: Node) => void
    onDeleteCard: (node: Node) => void
}