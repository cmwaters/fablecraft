import { Pos } from './pos'
import Delta from "quill-delta"

export type Node = {
    uid: number
    pos: Pos
    content: Delta | string
}

