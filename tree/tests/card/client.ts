import Delta from "quill-delta"
import { Card } from "../../src/card"
import { Pos } from "../../src/pos"

window.onload = () => {
    let container = document.getElementById("container")
    let node = {
        uid: 0,
        pos: new Pos(0, 0),
        content: new Delta(),
    }

    
    let card = new Card(container!, node, {
        margin: 20,
        updateFrequency: 2000,
    })
    card.focus()
    
    window.onkeydown = (e: KeyboardEvent) => {
        if (e.key === "Meta") {
            card.showCommandLine()
        }
    }
}