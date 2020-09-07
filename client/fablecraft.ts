import { PaperScope, Path, Color, Point, Size, Rectangle, Layer, PointText, Group } from "paper";
import { TextBox } from './text'
import { Card } from './card'

const paper = new PaperScope()
window.onload = () => {
    alert("Starting fablecraft")
    paper.install(window)
    const canvas = document.createElement('canvas')
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    paper.setup(canvas);
    document.body.appendChild(canvas)
    
    const card = new Card(new Point(300, 100), new Size(200, 40))

    console.log(card.text.box.height)
    console.log(card.box.bounds.height)

    document.onkeydown = (e) => {
        card.input(e.key)
    }

}