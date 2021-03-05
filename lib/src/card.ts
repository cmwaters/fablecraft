import { RedomComponent, el, mount } from "redom";
import { CommandLine } from './command'
import Quill from "quill"
import MarkdownShortcuts from 'quill-markdown-shortcuts'; 
import { Node } from "./node";
import { Pos } from "./pos"
import { Size, Vector } from './geometry'
import { CardConfig } from './config'
import "../assets/quill.css"

Quill.register('modules/markdownShortcuts', MarkdownShortcuts)

// we call this node instead of card to distinguish from the model and the view
export class Card implements RedomComponent {
    el: HTMLElement;
    editor: Quill;
    command: CommandLine

    private node: Node

    constructor(parent: HTMLElement, node: Node, config: CardConfig, insertBefore?: Card) {
        this.el = el("div.card", { style: { marginBottom: config.margin, marginTop: config.margin } })
        if (insertBefore) {
            mount(parent, this.el, insertBefore.el)
        } else {
            mount(parent, this.el)
        }
        this.node = node
        this.editor = new Quill(this.el as Element, {
            modules: {
                "markdownShortcuts": {}
            },
        })
        this.editor.setText(node.text)
        this.command = new CommandLine(this.el, true)
    }

    showCommandLine(): void {
        console.log("showing command line")
        this.editor.blur()
        this.command.show()
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

    backspace(): boolean {
        if (this.command.hasFocus()) {
            if (this.command.txt.value.length === 0) {
                this.command.hide()
                this.editor.focus()
            }
            return false
        }
        return this.editor.getLength() === 1
    }

    escape(): void {
        if (this.command.hasFocus()) {
            this.command.hide()
            this.editor.focus()
        } else {
            this.blur()
        }
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
        return this.editor.hasFocus() || this.command.hasFocus()
    }

    highlight(): void {
        this.el.style.color = "#666";
        this.el.style.border = "1px solid #fff"
    }

    getNode(): Node {
        return this.node
    }

    id(): number {
        return this.node.uid
    }

    incrementIndex(): void {
        this.node.pos.index++
    }

    decrementIndex(): void {
        this.node.pos.index--
    }

    setPos(pos: Pos): void {
        this.node.pos = pos
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
        this.command.hide()
    }

}