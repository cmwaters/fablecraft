import { svg } from "redom"
import Quill from "quill"
import Command from "./command"
let Block = Quill.import("blots/block")
// let Break = Quill.import("blots/break")
// let Inline = Quill.import("blots/inline")
let Container = Quill.import("blots/container")
import "./style.css"

class CommandSuggestion extends Block {
    static blotName = "cli-suggestion"
    static className = "ql-command-suggestion"
    static tagName = "DIV"

    command: Command

    constructor(domNode: Node, value: Command) {
        super(domNode);
        this.command = value;
        (domNode as HTMLElement).innerText = value.name.toString();
    }

    focus(): void {
        console.log("focusing on suggestion " + this.command.name);
        (this.domNode as HTMLElement).classList.replace("ql-command-suggestion", "ql-command-suggestion-focus")
    }

    blur(): void {
        (this.domNode as HTMLElement).classList.replace("ql-command-suggestion-focus", "ql-command-suggestion")
    }

    insertInto(parentBlot: any, refBlot?: any): void {
        parentBlot.domNode.appendChild(this.domNode)
    }
}

class CommandInterface extends Block {
    static blotName = "cli-interface"
    static tagName = "DIV"
    static className = "ql-command-interface"
    
    static create(value?: any): Node {
        console.log(value)
        let node = super.create(value)
        return node
    }

    constructor(domNode: Node) {
        super(domNode)
        this.domNode.appendChild(commandIcon)
    }

    format(format: string, value: any) {
        console.log("format interface " + value)
        if (format === "cli-interface") {
            console.log(this.children.head)
            this.children.head.domNode.data = value.toString()
        }
    }

    static value(domNode: any) {
        return domNode.innerText
    }

    value() {
        return this.domNode.innerText
    }
}

class CommandContainer extends Container {
    static blotName = "cli"
    static tagName = "DIV"
    static className = "ql-command-container"
    static defaultChild = "cli-interface"
    static allowedChildren = [CommandInterface, CommandSuggestion, Block]
}

const commandIcon = svg("svg", { viewBox: "0 0 16 16", fill: "#666", class: "ql-command-line-icon" }, [
    svg("path", { d: "M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9zM3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z" }),
    svg("path", { d: "M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12z" })
])

export { CommandContainer, CommandInterface, CommandSuggestion }