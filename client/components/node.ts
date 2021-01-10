import { RedomComponent, el, mount } from "redom";
import Quill from "quill"
import { Card } from "../model/card";
import { Size, Vector } from '../geometry'

// we call this node instead of card to distinguish from the model and the view
export class Node implements RedomComponent {
    el: HTMLElement;
    id: string
    children: string[] = []
    parent?: string
    editor: Quill;

    constructor(parent: HTMLElement, card: Card, margin: number) {
        this.el = el("div.card", { style: { marginBottom: margin}})
        mount(parent, this.el)
        this.editor = new Quill(this.el as Element)
        this.editor.setText(card.text)
        this.id = card._id
        if (card.children) this.children = card.children
        this.parent = card.parent
    }

    center(): Vector {
        return new Size(this.el.clientWidth, this.el.clientHeight).center()
    }
    
    focus(): void {
        this.el.style.backgroundColor = "blue";
    }

    highlight(): void {

    }

    blur(): void {
        this.el.style.backgroundColor = "lightblue";
    }

}