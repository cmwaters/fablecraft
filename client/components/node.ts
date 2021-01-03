import { RedomComponent, el } from "redom";
import Quill from "quill"
import { Card } from "../../models/card";
import { ViewComponent } from "./view_component";

// we call this node instead of card to distinguish from the model and the view
export class Node implements RedomComponent, ViewComponent {
    el: HTMLElement;
    editor: Quill;

    constructor(card: Card) {
        console.log("creating node: " + card)
        this.el = el("div.card")
        this.editor = new Quill(this.el as Element)
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