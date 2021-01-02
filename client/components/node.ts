import { RedomComponent, el } from "redom";
import { Card } from "../../models/card";
import { ViewComponent } from "./view_component";

// we call this node instead of card to distinguish from the model and the view
export class Node implements RedomComponent, ViewComponent {
    el: HTMLElement;

    constructor(card: Card) {
        this.el = el("div.card", card.text)
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