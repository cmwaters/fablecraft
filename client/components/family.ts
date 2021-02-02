import { RedomComponent, el, mount, unmount } from "redom";
import { ViewComponent } from "./view_component";
import { Card, CardConfig } from "./card";
import { CardMeta } from "../model/card";
import { Vector } from '../geometry'

export class Family implements RedomComponent {
    el: HTMLElement;
    margin: number;
    cardConfig: CardConfig;
    cards: Card[] = [];

    constructor(parent: HTMLElement, cards: CardMeta[], config: FamilyConfig, insertBefore?: Family) {
        this.el = el("div.family", { style: { marginBottom: config.margin, marginTop: config.margin}})
        if (insertBefore) {
            mount(parent, this.el, insertBefore)
        } else {
            mount(parent, this.el)
        }
        cards.forEach((cardMeta) => {
            let card = new Card(this.el, cardMeta, config.card)
            this.cards.push(card)
        })
        this.cardConfig = config.card
        this.margin = config.margin
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
            offset += this.cards[i].el.offsetHeight + (1 * this.cardConfig.margin)
        }
        return offset + (this.cards[index].el.offsetHeight / 2)
    }

    insertCardAbove(index: number): Card {
        if (this.cards.length === 0) {
            let card = new Card(this.el, null, this.cardConfig)
            this.cards = [card]
            let index = 0
            return card
        }
        // create card
        let card = new Card(this.el, null, this.cardConfig, this.cards[index])
        // set parent
        card.parent = this.cards[0].parent
        this.cards.splice(index, 0, card)
        return card
    }

    appendCard(parent?: number): { card: Card, index: number } {
        let card = new Card(this.el, null, this.cardConfig)
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
    static separateCardsIntoFamilies(cards: Card[]): Card[][] {
        let output: Card[][] = []
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

export type FamilyConfig = {
    card: CardConfig
    margin: number
}