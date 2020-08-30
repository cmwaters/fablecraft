import { PaperScope, Path, Color, Point, Size, Rectangle, Layer, PointText, Group } from "paper";
import { TextBox } from './text'

const paper = new PaperScope()
window.onload = () => {
    alert("Starting fablecraft")
    paper.install(window)
    const canvas = document.createElement('canvas')
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    paper.setup(canvas);
    document.body.appendChild(canvas)
    alert("Finished fablecraft")
    
    const text = new TextBox({
        content: "Hello World", 
        position: new Point(300, 100), 
        size: new Size(200, 100)
    });

    document.onkeydown = (e) => {
        text.input(e.key)
    }

}