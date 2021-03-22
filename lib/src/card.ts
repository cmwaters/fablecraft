import { RedomComponent, el, mount } from "redom";
import { CommandLine } from './command'
import Quill from "quill"
import Delta from "quill-delta"
import { Node } from "./node";
import { Pos } from "./pos"
import { Size, Vector } from './geometry'
import { CardConfig } from './config'
import "../assets/quill.css"

// we call this node instead of card to distinguish from the model and the view
export class Card implements RedomComponent {
    el: HTMLElement;
    editor: Quill;
    command: CommandLine
    onModify?: (update: Delta) => void
    onMove?: (pos: Pos, oldPos: Pos) => void

    private position: Pos
    private uid: number
    private diff: Delta = new Delta()
    private updater: NodeJS.Timeout | undefined = undefined

    // TODO: instead of updating every x seconds, perhaps a smarter method would be only to
    // fire an event when the user hasn't inputted any more in the last x seconds (similar to google drive)
    private updateFrequency: number

    constructor(parent: HTMLElement, node: Node, config: CardConfig, insertBefore?: Card) {
        this.el = el("div.card", { style: { marginBottom: config.margin, marginTop: config.margin } })
        if (insertBefore) {
            mount(parent, this.el, insertBefore.el)
        } else {
            mount(parent, this.el)
        }
        this.position = node.pos
        this.uid = node.uid
        this.editor = new Quill(this.el as Element)
        if (typeof node.content === "string") {
            this.editor.setText(node.content)
        } else {
            this.editor.setContents(node.content, "api")
        }
        this.command = new CommandLine(this.el, true)
        this.editor.on("text-change", (delta: Delta, oldDelta: Delta, source: string) => {
            if (source === "user") {
                this.diff = this.diff.compose(delta)
            }
        })
        this.updateFrequency = config.updateFrequency
    }

    

    showCommandLine(): void {
        console.log("showing command line")
        this.editor.blur()
        this.command.show()
    }

    center(): Vector {
        return new Size(this.el.clientWidth, this.el.clientHeight).center()
    }

    modify(delta: Delta) {
        this.editor.updateContents(delta, "api")
    }

    backspace(): boolean {
        console.log("BACKSPACE")
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

    focus(pos: "start" | "end" | number = "end"): void {
        setTimeout(() => {
            this.updater = setInterval(() => {
                if (this.diff.length() > 0) {
                    if (this.onModify) {
                        this.onModify(this.diff)
                        this.diff = new Delta()
                    }
                }
            }, this.updateFrequency)
            this.editor.focus()
            if (pos === "end") {
                this.editor.setSelection(this.editor.getLength(), 0, "user")
            } else if (typeof pos === "number") {
                this.editor.setSelection(pos, 0, "user")
            }
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
        this.el.style.boxShadow = "0 0 0 0";
    }

    node(): Node {
        return { 
            uid: this.uid,
            pos: this.position,
            content: this.editor.getContents(),
        }
    }

    pos(): Pos {
        return this.position
    }

    id(): number {
        return this.uid
    }

    incrementIndex(): void {
        this.position.index++
    }

    decrementIndex(): void {
        this.position.index--
    }

    setPos(pos: Pos): void {
        if (this.onMove) {
            this.onMove(pos, this.position)
        }
        this.position = pos
    }

    spotlight(): void {
        this.el.style.color = "#444";
        this.el.style.boxShadow = "0 4px 8px 0 rgba(0, 0, 0, 0.2)";
    }

    dull(): void {
        console.log("making node dull")
        this.el.style.color = "#aaa";
        this.el.style.boxShadow = "0 0 0 0";
    }

    blur(): void {
        // flush out the remaining changes as an event
        if (this.diff.length() > 0) {
            if (this.onModify) {
                this.onModify(this.diff)
                this.diff = new Delta()
            }
        }
        // stop the ticker
        if (this.updater) {
            clearInterval(this.updater)
            this.updater = undefined
        }
        this.editor.blur()
        this.command.hide()
    }

}