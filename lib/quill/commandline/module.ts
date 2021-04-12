import Quill from "quill"
let Module = Quill.import('core/module')
import Command from "./command"
// import { CommandInterface, Commander, CommandSuggestions } from "./blots"
let Embed = Quill.import("blots/embed");

class CommandLine extends Module {
    static register() {
        console.log(Commander)
        Quill.register("blots/cli", Commander)
        // Quill.register("blots/cli-interface", CommandInterface)
        // Quill.register("blots/cli-suggestion", CommandSuggestions)
        console.log("registering blots")
    }

    ctrlDown = false
    visible = false
    commands: Command[] = []

    constructor(quill: Quill, options: {
        commands: Command[]
    }) {
        super(quill, options)
        console.log(options)
        this.commands = options.commands

        this.quill.root.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Control" || e.key === "Meta") {
                this.ctrlDown = true;
            } else if (this.ctrlDown) {
                this.ctrlDown = false
            }
        }

        this.quill.root.onkeyup = (e: KeyboardEvent) => {
            if (e.key === "Control" || e.key === "Meta") {
                if (this.visible) {
                    this.hide()
                } else if (this.ctrlDown) {
                    this.display()
                }
            } else if (e.key === "Escape" && this.visible) {
                this.hide()
            }
        }

    }

    display() {
        console.log("displaying command line")
        let selection = this.quill.getSelection()
        if (!selection) { return }
        // in the future we need to pass in commands
        this.quill.insertEmbed(selection!.index, "cli", true)
    }

    hide() {
        console.log("hidiing command line")
    }
}

class Commander extends Embed {
    static blotName = "cli"
    static tagName = "div"
    static className = "ql-command-line"

    // static create(value?: any): Node {
    //     console.log(value)
    //     let node = super.create()
    //     let input = el("input", {
    //         placeholder: "Enter a command",
    //         autofocus: true,
    //     })
    //     mount(node, el("div.ql-command-line-interface", [
    //         CommandIcon,
    //         input,
    //     ]))
    //     input.onkeydown = (ev: KeyboardEvent) => {
    //         console.log(ev.key)
    //     }

    //     return node
    // }
}

export { CommandLine, Commander }