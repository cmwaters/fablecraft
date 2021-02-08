import { RedomComponent, el, mount, unmount } from "redom";
import { Card } from "./card";
import { Node  } from "./node";
import { Vector } from './geometry'
import { FamilyConfig } from './config'

export class Family implements RedomComponent {
    el: HTMLElement;
    margin: number;
    config: FamilyConfig;
    cards: Card[] = [];

    constructor(parent: HTMLElement, nodes: Node[], config: FamilyConfig, insertBefore?: Family) {
        this.el = el("div.family", { style: { marginBottom: config.margin, marginTop: config.margin}})
        if (insertBefore) {
            mount(parent, this.el, insertBefore)
        } else {
            mount(parent, this.el)
        }
        nodes.forEach((node) => {
            let card  = new Card(this.el, node, config.card)
            this.cards.push(card)
        })
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
            offset += this.cards[i].el.offsetHeight + (1 * this.config.card.margin)
        }
        return offset + (this.cards[index].el.offsetHeight / 2)
    }

    insertCard(node: Node) {
        if (this.cards.length === 0) {
            let card = new Card(this.el, node, this.config.card)
            this.cards = [card]
            return card
        }
        // create card
        let card = new Card(this.el, null, this.config.card, this.cards[index])
        // set parent
        card.parent = this.cards[0].parent
        this.cards.splice(index, 0, card)
        return card
    }

    appendCard(node: Node): { card: Card, index: number } {
        let card = new Card(this.el, null, this.config.card)
        if (parent) card.parent = parent
        this.cards.push(card)
        return { card, index: this.cards.length - 1}
    }

    deleteCard(index: number): void {
        unmount(this.el, this.cards[index].el)
        this.cards.splice(index, 1)
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
        this.margin = margin
        this.el.style.marginTop = margin + "px"
        this.el.style.marginBottom = margin + "px"
    }

    // separateCardsIntoFamilies takes an array of cards (usually meant as part of a pillar)
    // and groups the cards by family whilst still retaining order
    static separateCardsIntoFamilies(cards: Node[]): Node[][] {
        let output: Node[][] = []
        if (!cards[0].parent) {
            // it is the root. Hence there is only a single family
            output = [cards]
        } else {
            // divide the cards based on slices of cards that share the same parent (i.e. a Family)
            let parent = cards[0].parent
            let priorIndex = 0;
            for (let index = 0; index < cards.length; index++) {
                if (cards[index].parent !== parent) {
                    // add the family from the slice
                    output.push(cards.slice(priorIndex, index))
                    // reset the index and parent
                    priorIndex = index
                    parent = cards[index].parent!
                }
            }
            // add the remaining cards together as a family
            output.push(cards.slice(priorIndex, cards.length))
        } 
        return output
    }

}

