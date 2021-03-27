import Quill from "quill";
let Embed = Quill.import("blots/embed");
let Inline = Quill.import("blots/inline");

export class StoryBlot extends Embed {
}
StoryBlot.blotName = "story"
StoryBlot.tagName = "div"
StoryBlot.className = "ql-story"

export class CardBlot extends Inline {
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
CardBlot.blotName = "card"
CardBlot.tagName = "spam"
CardBlot.className = "ql-card"

