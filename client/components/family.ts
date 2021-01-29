import { RedomComponent, el, mount, unmount } from "redom";
import { ViewComponent } from "./view_component";
import { Node, NodeConfig } from "./node";
import { Card } from "../model/card";
import { Vector } from '../geometry'

export class Family implements RedomComponent {
    el: HTMLElement;
    margin: number;
    nodeConfig: NodeConfig
    nodes: Node[] = [];

    constructor(parent: HTMLElement, cards: Card[], config: FamilyConfig, insertBefore?: Family) {
        this.el = el("div.family", { style: { marginBottom: config.margin, marginTop: config.margin}})
        if (insertBefore) {
            mount(parent, this.el, insertBefore)
        } else {
            mount(parent, this.el)
        }
        cards.forEach((card) => {
            let node = new Node(this.el, card, config.card)
            this.nodes.push(node)
        })
        this.nodeConfig = config.card
        this.margin = config.margin
    }

    // cardOffset returns the amount of pixels between the top of the family and the
    // center of the node.
    cardOffset(index: number): number {
        console.log("cardOffset, nodes: " + this.nodes.length)
        // if it is an empty family then return half it's height
        if (this.nodes.length === 0) {
            console.log("Here. " + this.el.offsetHeight)
            return this.el.offsetHeight / 2
        }
        if (index >= this.nodes.length) {
            console.error("cardOffest: index is greater than the amount of nodes")
        }
        let offset = 0;
        for (let i = 0; i < index; i++) {
            offset += this.nodes[i].el.offsetHeight + (1 * this.nodeConfig.margin)
        }
        return offset + (this.nodes[index].el.offsetHeight / 2)
    }

    insertCardAbove(index: number): Node {
        if (this.nodes.length === 0) {
            let node = new Node(this.el, null, this.nodeConfig)
            this.nodes = [node]
            let index = 0
            return node
        }
        // create node
        let node = new Node(this.el, null, this.nodeConfig, this.nodes[index])
        // set parent
        node.parent = this.nodes[0].parent
        this.nodes.splice(index, 0, node)
        return node
    }

    appendCard(parent?: string): { node: Node, index: number } {
        let node = new Node(this.el, null, this.nodeConfig)
        if (parent) node.parent = parent
        this.nodes.push(node)
        return { node, index: this.nodes.length - 1}
    }

    deleteCard(index: number): void {
        unmount(this.el, this.nodes[index].el)
        this.nodes.splice(index, 1)
    }

    expand(height: number): void {
        this.el.style.height = height + "px"
    }

    highlight(): void {
        this.nodes.forEach(node => node.highlight())
    }

    dull(): void {
        this.nodes.forEach(node => node.dull())
    }

    collapse(): void {
        if (this.nodes.length === 0) {
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
    card: NodeConfig
    margin: number
}