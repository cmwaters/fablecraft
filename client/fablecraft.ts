import { PaperScope, Path, Color, Point, Size, Rectangle, Layer, PointText, Group } from "paper";
import { Card } from './card'
import { Story } from './story'
import ArrowDown from './icons/box-arrow-in-down.svg'

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

    // paper.project.importSVG(ArrowDown, {
    //     onLoad: (item: any) => {
    //         item.position = new Point(50, 50)
    //         item.scale(100)
    //     }
    // })
    
    let snippets = [{
        text: "Hello World",
        depth: 1,
        index: 1,
    }, {
        text: "Welcome to Fablecraft",
        depth: 1,
        index: 2,
    }, {
        text: "An elegant text editor with an emphasis on structured design",
        depth: 1,
        index: 3,
    }]
    
    let story = new Story("My Story", paper.project, snippets)
    
    // window.addEventListener("resize", () => {
    //     canvas.height = window.innerHeight
    //     canvas.width = window.innerWidth
    // })

    // const card = new Card(new Point(300, 100), 400, new Size(20, 20))

}