import Quill from "quill"
let Module = Quill.import('core/module')
import Command from "./command"
import { CommandInterface, Commander, CommandSuggestions } from "./blots"

class CommandLine extends Module {
    static register() {
        Quill.register("blots/cli", Commander)
        Quill.register("blots/cli-interface", CommandInterface)
        Quill.register("blots/cli-suggestion", CommandSuggestions)
    }

    ctrlDown = false
    consoleDisplay = false
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
                if (this.ctrlDown) {
                    this.display()
                }
            }
        }

    }

    display() {
        let selection = this.quill.getSelection()
        // in the future we need to pass in commands
        this.quill.insertEmbed(selection!.index, "cli", this.commands)
    }

    hide() {

    }
}

export default CommandLine