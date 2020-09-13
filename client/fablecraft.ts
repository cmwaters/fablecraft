import { PaperScope, Path, Color, Point, Size, Rectangle, Layer, PointText, Group } from "paper";
import { Story, Snippet } from './story'
import { StrGen, NumGen } from './libs/rand'
// import ArrowDown from './icons/box-arrow-in-down.svg'

const paper = new PaperScope()
window.onload = () => {
    console.log("Starting fablecraft")
    console.log(window.devicePixelRatio)
    paper.install(window)
    const canvas = document.createElement('canvas')
    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight
    // canvas.style.width = document.body.clientWidth + "px";
    // canvas.style.height = document.body.clientHeight + "px";
    
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
    
    
    
    let story = new Story("My Story", paper.project, makeRandomSnippets(4))
    
    window.addEventListener("resize", () => {
        canvas.width = document.body.clientWidth
        canvas.height = document.body.clientHeight
    })

}

function makeRandomSnippets(length: number): Snippet[] {
    let snippets: Snippet[] = []
    for (let i = 0; i < length; i ++) {
        snippets.push({
            text: StrGen.words(NumGen.int(20, 5)),
            depth: 1,
            index: i + 1
        })
    }
    return snippets
}