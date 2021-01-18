import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Node, NodeConfig } from "./node";
import { Card } from "../model/card";
import { Vector } from '../geometry'
import { Config } from "../config"

export class Family implements RedomComponent {
    el: HTMLElement;
    margin: number;
    nodes: Node[] = [];

    constructor(parent: HTMLElement, cards: Card[], config: FamilyConfig) {
        this.el = el("div.family", { style: { marginBottom: config.margin, marginTop: config.margin}})
        mount(parent, this.el)
        cards.forEach((card) => {
            let node = new Node(this.el, card, config.card)
            this.nodes.push(node)
            mount(this.el, node.el)
        })
        this.margin = config.margin
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
    card: NodeConfig
    margin: number
}