import Quill from "quill"
let Inline = Quill.import("blots/inline")

class CommandInterface extends Inline {

}
CommandInterface.blotName = "cli-interface"
CommandInterface.tagName = "SPAN"

export default CommandInterface