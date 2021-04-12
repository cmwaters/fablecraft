import Quill from "quill";
let Embed = Quill.import("blots/embed");
let Inline = Quill.import("blots/inline");

export class StoryBlot extends Embed {
    static blotName = "story"
    static tagName = "div"
    static className = "ql-story"
}

export class CardBlot extends Inline {
    static blotName = "card"
    static tagName = "spam"
    static className = "ql-card"
    static create(value?: any): Node {
        let node = super.create()
        console.log(value)
        node.innerHTML = "#" + value.toString()
        node.onclick = () => {
            alert("you just clicked me")
        }
        return node
    }
}

export class Commander extends Embed {
    static blotName = "cli"
    static tagName = "div"
    static className = "ql-command-line"
}

