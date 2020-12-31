import { RedomComponent } from "redom";
import { ViewComponent } from "./view_component";
import { Node } from "./node";
import { Card } from "../../models/card";

export class Family implements RedomComponent, ViewComponent {
    el: HTMLElement;
    nodes: Node[] = [];

    constructor(cards: Card[]) {
        cards.forEach(card => {
            this.nodes.push(new Node(card))
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