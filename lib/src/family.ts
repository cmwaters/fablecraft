import { RedomComponent, el, mount, unmount } from "redom";
import { Card } from "./card";
import { Node } from "./node";
import { Pos } from "./pos"
import { FamilyConfig } from './config'
import { errors } from "./errors"

export class Family implements RedomComponent {
    el: HTMLElement;
    config: FamilyConfig;
    cards: Card[] = [];

    constructor(parent: HTMLElement, config: FamilyConfig, insertBefore?: Family) {
        this.el = el("div.family", { style: { marginBottom: config.margin, marginTop: config.margin}})
        if (insertBefore) {
            mount(parent, this.el, insertBefore)
        } else {
            mount(parent, this.el)
        }
        this.config = config
    }

    // cardOffset returns the amount of pixels between the top of the family and the
    // center of the card.
    cardOffset(index: number): number {
        console.log("cardOffset, cards: " + this.cards.length)
        // if it is an empty family then return half it's height
        if (this.cards.length === 0) {
            console.log("Here. " + this.el.offsetHeight)
            return this.el.offsetHeight / 2
        }
        if (index >= this.cards.length) {
            console.error("cardOffest: index is greater than the amount of cards")
        }
        let offset = 0;
        for (let i = 0; i < index; i++) {
            offset += this.cards[i].el.offsetHeight + this.config.card.margin
        }
        return offset + (this.cards[index].el.offsetHeight / 2)
    }

    insertCard(node: Node): void {
        if (node.pos.index > this.cards.length) {
            throw new Error(errors.indexOutOfBounds)
        }

        for (let i = node.pos.index; i < this.cards.length; i++) {
            this.cards[i].incrementIndex()
        } 

        if (node.pos.index === this.cards.length) {
            return this.appendCard(node)
        }

        let card = new Card(this.el, node, this.config.card, this.cards[node.pos.index])
        this.cards.splice(node.pos.index, 0, card)

        
    }

    appendCard(node: Node): void {
        // if this is the first card we need to reset set it's height
        // to auto so that is dynamically expands to the size of the cards
        if (this.cards.length === 0) {
            this.el.style.height = "auto"
        }
        this.cards.push(new Card(this.el, node, this.config.card))
    }

    isEmpty(): boolean {
        return this.cards.length === 0
    }

    shiftFamilyIndex(delta: number): void {
        this.cards.forEach(card => card.setPos(card.pos().shift({family: delta})))
    }

    // delete card removes the card from the family, shifts
    // the index of the cards below down by one and returns the
    // id of the deleted card (so as to update the card indexer)
    deleteCard(index: number): number {
        let id = this.cards[index].node().uid
        this.cards[index].setPos(Pos.null())

        unmount(this.el, this.cards[index].el)
        this.cards.splice(index, 1)
        for (let i = index; i < this.cards.length; i++) {
            this.cards[i].decrementIndex()
        } 

        return id
    }

    expand(height: number): void {
        this.el.style.height = height + "px"
    }

    highlight(): void {
        this.cards.forEach(card => card.highlight())
    }

    dull(): void {
        this.cards.forEach(card => card.dull())
    }

    collapse(): void {
        if (this.cards.length === 0) {
            this.el.style.height = "auto"
        }
    }

    setMargin(margin: number): void {
        this.config.margin = margin
        this.el.style.marginTop = margin + "px"
        this.el.style.marginBottom = margin + "px"
    }

}

