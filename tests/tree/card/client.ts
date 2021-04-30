import Delta from "quill-delta"
import { Card } from "../../../tree/card"
import { Pos } from "../../../tree/pos"
import { Tree } from "../../../tree/tree"
import { defaultConfig } from "../../../tree/config"

window.onload = () => {
    let container = document.getElementById("container")
    let node = {
        uid: 0,
        pos: new Pos(0, 0),
        content: new Delta(),
    }

    let tree = new Tree(container!, defaultConfig(), [node])
    
    // let card = new Card(container!, node, {
    //     margin: 20,
    //     updateFrequency: 2000,
    // })
    // card.focus()
    
    // window.onkeydown = (e: KeyboardEvent) => {
    //     if (e.key === "Meta") {
    //         card.showCommandLine()
    //     }
    // }
}