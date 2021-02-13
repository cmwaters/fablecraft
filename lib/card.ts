import { RedomComponent, el, mount } from "redom";
import Quill from "quill"
import { Node } from "./node";
import { Size, Vector } from './geometry'
import { CardConfig } from './config'

// we call this node instead of card to distinguish from the model and the view
export class Card implements RedomComponent {
    el: HTMLElement;
    node: Node
    editor: Quill;

    constructor(parent: HTMLElement, node: Node, config: CardConfig, insertBefore?: Card) {
        this.el = el("div.card", { style: { marginBottom: config.margin, marginTop: config.margin } })
        if (insertBefore) {
            mount(parent, this.el, insertBefore.el)
        } else {
            mount(parent, this.el)
        }
        this.node = node
        this.editor = new Quill(this.el as Element)
        this.editor.setText(node.text)
    }

    center(): Vector {
        return new Size(this.el.clientWidth, this.el.clientHeight).center()
    }

    modify(text: string) {
        this.editor.setText(text)
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
        this.el.style.color = "#666";
        this.el.style.border = "1px solid #fff"
    }

    spotlight(): void {
        this.el.style.color = "#444";
        this.el.style.border = "1px solid #ccc"
    }

    dull(): void {
        console.log("making node dull")
        this.el.style.color = "#999";
        this.el.style.border = "1px solid #fff"
    }

    blur(): void {
        this.editor.blur()
    }

}