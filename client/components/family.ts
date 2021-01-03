import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Node } from "./node";
import { Card } from "../../models/card";

export class Family implements RedomComponent, ViewComponent {
    el: HTMLElement;
    nodes: Node[] = [];

    constructor(cards: Card[]) {
        this.el = el("div.family")
        cards.forEach((card, index) => {
            let node = new Node(card)
            this.nodes.push(node)
            mount(this.el, node.el)
        })
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