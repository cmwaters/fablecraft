import { Card } from "./card"

// Branch is a representation of a card and all it's children
export type Branch = {
    card: Card;
    children: Branch[];
}