import Quill from "quill"
import Parchment from "parchment"
import Delta from "quill-delta"
let Module = Quill.import('core/module')
let Inline = Quill.import('blots/inline')

import Command from "./command"
import { CommandInterface, CommandSuggestion, CommandContainer } from "./blots"



class CommandLine extends Module {
    static register() {
        Parchment.register(CommandInterface, CommandSuggestion, CommandContainer)
        Quill.register("blots/cli", CommandContainer, false)
        Quill.register("blots/cli-interface", CommandInterface, false)
        Quill.register("blots/cli-suggestion", CommandSuggestion, false)
        console.log("registering blots")
    }

    ctrlDown = false
    priorIndex: number = 0;
    index: number = 0;
    commands: Command[] = []
    cli: any = null;
    interface: any = null;
    suggestions: any[] = [];
    focusedSuggestion: number = -1

    constructor(quill: Quill, options: {
        commands: Command[]
    }) {
        super(quill, options)
        console.log(options)
        this.commands = options.commands

        this.quill.scroll.statics.allowedChildren.push(CommandContainer, CommandInterface, CommandSuggestion)
        console.log(this.quill.scroll)

        // overide the keyboard bindings by inserting this one in first.
        // FIXME: the addBinding() func should be sufficient here but the
        // matching algorithm just takes the first match hence the handler is
        // never fired.
        this.quill.keyboard.bindings[13].unshift({ key: "Enter", shiftKey: null, format: ["cli-interface"], handler: (range: number, context: any) => {
            this.execute()
        }})

        this.quill.keyboard.bindings[40] = [({
            key: 40, format: ["cli-interface"], handler: (range: any, context: any) => {
                this.down()
            }
        })]

        this.quill.keyboard.bindings[38] = [({
            key: 38, format: ["cli-interface"], handler: (range: any, context: any) => {
                this.up()
            }
        })]

        this.quill.keyboard.bindings[8] = [({
            key: 8, format: ["cli-interface"], handler: (range: any, context: any) => {
                if (!this.isActive()) { return }
                if (range.index < this.index + 1) {
                    this.hide()
                } else if (range.index == this.index + 1) {
                    this.quill.updateContents(new Delta()
                        .retain(range.index - 1)
                        .insert("", { br: true })
                        .delete(1)
                    )
                } else {
                    this.quill.updateContents(new Delta()
                        .retain(range.index - 1)
                        .delete(1)
                    )
                }
            }
        })]

        // track selection changes to understand when the user has left the
        // command line
        this.quill.on("selection-change", (range: any, oldRange: any, source: string) => {
            if (this.isActive()) {
                if (range.index < this.index || range.index > this.index + this.interface.cache.length) {
                    this.hide()
                }
            }
        })

        // track keyboard inputs to display/hide/execute/suggest 
        this.quill.root.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Control" || e.key === "Meta") {
                this.ctrlDown = true;
            } else if (this.ctrlDown) {
                this.ctrlDown = false
            }
        }
        this.quill.root.onkeyup = (e: KeyboardEvent) => {
            if (e.key === "Control" || e.key === "Meta") {
                if (this.interface) {
                    if (this.quill.getIndex(this.interface) === -1) { 
                        this.reset()
                        this.display()
                    } else {
                        this.hide()
                    }
                } else if (this.ctrlDown) {
                    this.display()
                }
                return
            } 
            
            if (this.isActive()) {
                if (e.key === "Escape") {
                    this.hide()
                } else if (this.isLetterOrNumber(e.key) || e.key === "Backspace") {
                    this.suggest()
                }
            }
        }
    }

    isActive() {
        return this.cli !== null
    }

    isLetterOrNumber(key: string) {
        return key.length === 1
    }

    display() {
        console.log("displaying command line")
        let selection = this.quill.getSelection()
        if (!selection) { return }
        this.priorIndex = selection!.index
        let prev = this.quill.getLeaf(this.priorIndex)[0].parent
        console.log(prev)
        console.log(prev.children.head.statics.blotName)
        let prevIndex = this.quill.getIndex(prev)
        console.log(prevIndex)
        this.index = prevIndex + prev.cache.length

        if (prev.children.head.statics.blotName == "break") {
            prev.remove()
            this.index++
        }

        console.log(this.index)
        this.quill.insertEmbed(this.index, "cli", "")
        this.interface = this.quill.getLeaf(this.index)[0].parent
        this.cli = this.interface.parent
        console.log(this.interface)
        console.log(this.cli)
        this.quill.setSelection(this.index!, 0, "api")

        console.log(this.quill.keyboard.bindings)
    }

    hide() {
        console.log("hiding command line")
        this.quill.scroll.deleteAt(this.index, this.interface.cache.length)
        this.quill.setSelection(this.priorIndex, 0, "api")
        this.reset()
    }

    reset() {
        this.index = 0;
        this.interface = null;
        this.cli = null;
        this.priorIndex = 0;
        this.focusedSuggestion = -1;
    }

    down() {
        if (this.isActive() && this.suggestions.length !== 0) {
            if (this.focusedSuggestion < 0) {
                this.focusedSuggestion = 0
                this.suggestions[this.focusedSuggestion].focus()
            } else {
                this.suggestions[this.focusedSuggestion].blur()
                this.focusedSuggestion = (this.focusedSuggestion + 1) % this.suggestions.length
                this.suggestions[this.focusedSuggestion].focus()
            }
            let text = this.suggestions[this.focusedSuggestion].command.name
            this.interface.format(CommandInterface.blotName, text)
            this.quill.update()
            this.quill.setSelection(this.index + text.length, 0, "api")
        }
    }

    up() {
        if (this.isActive() && this.suggestions.length !== 0) {
            if (this.focusedSuggestion < 0) {
                this.focusedSuggestion = this.suggestions.length - 1
                this.suggestions[this.focusedSuggestion].focus()
            } else {
                this.suggestions[this.focusedSuggestion].blur()
                this.focusedSuggestion--
                if (this.focusedSuggestion < 0) {
                    this.focusedSuggestion = this.suggestions.length - 1
                }
                this.suggestions[this.focusedSuggestion].focus()
            }
            let text = this.suggestions[this.focusedSuggestion].command.name
            this.interface.format(CommandInterface.blotName, text)
            this.quill.update()
            this.quill.setSelection(this.index + text.length, 0, "api")
        }
    }

    execute() {
        console.log("execute")
        if (!this.isActive) { return }

        let input = this.interface.children.head.text.toLowerCase()
        console.log(input)
        this.commands.forEach(command => {
            if (command.name.toLowerCase() == input) {
                command.cmd()
            }
        })
        this.hide()
    }

    suggest() {
        if (this.cli.children.head) {
            console.log(this.suggestions.length + " suggestions")
            for (let suggestion of this.suggestions) {
                console.log("deleting suggestion")
                console.log(suggestion)
                suggestion.remove()
            }
            this.suggestions = []
            let cmds = this.match(this.interface.children.head.text)
            console.log("matched " + cmds.length + " commands.")
            for (let cmd of cmds) {
                console.log("adding suggestion " + cmd.name)
                let suggestion = Parchment.create("cli-suggestion", cmd)
                this.suggestions.unshift(suggestion)
                this.cli.appendChild(suggestion)
            }
        }
    }

    match(input: string): Command[] {
        if (input === "" || input === undefined) { return [] }
        input = input.toLowerCase()
        let commands: Command[] = []
        this.commands.forEach(command => {
            if (command.name.toLowerCase().match(input)) {
                commands.push(command)
            }
        })
        return commands
    }
}

export default CommandLine