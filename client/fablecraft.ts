import { PaperScope, Path, Color, Point, Size, Rectangle, Layer, PointText, Group } from "paper";
import { Card } from './card'
import { Story } from './story'

const paper = new PaperScope()
window.onload = () => {
    console.log("Starting fablecraft")
    console.log(window.devicePixelRatio)
    paper.install(window)
    const canvas = document.createElement('canvas')
    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight
    canvas.style.width = document.body.clientWidth + "px";
    canvas.style.height = document.body.clientHeight + "px";
    
    document.body.appendChild(canvas)
    
    var ctx = canvas.getContext("2d");
    
    ctx.translate(0.5, 0.5);
    
    paper.setup(canvas);
    
    let snippets = [{
        text: "Hello World",
        depth: 1,
        index: 1,
    }, {
        text: "Welcome to Fablecraft",
        depth: 1,
        index: 2,
    }]
    
    let story = new Story("My Story", snippets)
    
    // const card = new Card(new Point(300, 100), 400, new Size(20, 20))

}