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

    const playerSprite = new Path.Circle(new Point(100, 100), 20);
    playerSprite.fillColor = new Color("black");
    playerSprite.onClick = () => {
        console.log("Hello World")
    }
    
    const text = new TextBox("Hello World", new Point(0, 100), new Size(200, 100));
    // text.fontSize = "40px"
    
    let anotherText = new PointText({
        content: "Hello World",
        point: new Point(300, 100),
        fontSize: "16px"
    })
    anotherText.onClick = () => {
        console.log("Hello World")
    }

}