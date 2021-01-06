import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Node } from "./node";
import { Card } from "../model/card";

export class Family implements RedomComponent, ViewComponent {
    el: HTMLElement;
    nodes: Node[] = [];

    // we don't know the height up front. This must be calculated by creating
    // all the cards and returning the height so that the pillar controlling
    // the family can position it appropriately.
    constructor(cards: Card[], top: number, margin: number) {
        this.el = el("div.family", { style: { top: top}})
        cards.forEach((card) => {
            let node = new Node(card, margin)
            this.nodes.push(node)
            mount(this.el, node.el)
        })
    }

    height(): number {
        return this.el.clientHeight
    }
    
    hasFocus(): boolean {
        throw new Error("Method not implemented.");
    }
    focus(): void {
        throw new Error("Method not implemented.");
    }
    blur(): void {
        throw new Error("Method not implemented.");
    }

}
