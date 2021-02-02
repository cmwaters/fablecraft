import { RedomComponent, el, mount } from "redom";
import Quill from "quill"
import { CardMeta } from "../model/card";
import { Size, Vector } from '../geometry'

// we call this node instead of card to distinguish from the model and the view
export class CardElement implements RedomComponent {
    el: HTMLElement;
    index: number
    children: number[] = []
    parent?: number
    editor: Quill;

    constructor(parent: HTMLElement, card: CardMeta | null, config: CardConfig, insertBefore?: CardElement) {
        this.el = el("div.card", { style: { marginBottom: config.margin, marginTop: config.margin } })
        if (insertBefore) {
            mount(parent, this.el, insertBefore.el)
        } else {
            mount(parent, this.el)
        }
        this.editor = new Quill(this.el as Element)
        if (card) {
            this.editor.setText(card.text)
            this.index = card.index
            if (card.children) this.children = card.children
            this.parent = card.parent
        }
    }

    center(): Vector {
        return new Size(this.el.clientWidth, this.el.clientHeight).center()
    }

    focusStart(): void {
        setTimeout(() => {
            this.editor.focus()
        }, 100)

        this.spotlight()
    }

    focus(): void {
        setTimeout(() => {
            this.editor.focus()
            this.editor.setSelection(this.editor.getLength(), 0, "user")
        }, 100)

        this.spotlight()
    }

    atStart(): boolean {
        let range = this.editor.getSelection()
        return range === null || range.index === 0
    }

    atEnd(): boolean {
        let range = this.editor.getSelection()
        return range === null || range.index === this.editor.getLength() - 1
    }

    hasFocus(): boolean {
        return this.editor.hasFocus()
    }

    highlight(): void {
        this.el.style.color = "blue";
        this.el.style.backgroundColor = "#fff";
    }

    spotlight(): void {
        this.el.style.color = "red";
        this.el.style.backgroundColor = "#eee";
    }

    dull(): void {
        console.log("making node dull")
        this.el.style.color = "#777";
        this.el.style.backgroundColor = "#fff";
    }

    blur(): void {
        this.editor.blur()
    }

}

export type CardConfig = {
    margin: number
}