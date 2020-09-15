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
    if (ctx !== null) {
        ctx.translate(0.5, 0.5);
    }
    paper.setup(canvas);

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
            index: i + 1, 
            parent: null
        })
    }
    return snippets
}

// function makeRandomSnippetTree(widths: number[]): Snippet[] {
//     let snippets: Snippet[] = []
//     let parentIdx = 0
//     let splitPoints = []
//     for (let depth = 0; depth < widths.length; depth++) {
//         if (depth !== 0) {
//             parentIdx
//             let parents = widths[depth - 1]
//             let children = widths[depth]
//             let current = children/parents
//             for (let i = 0; i < parents; i++) {
//                 splitPoints.push(current)
//                 current += (children/parents)
//             }
//         }
//         for (let idx = 0; idx < widths[depth]; idx++) {
//             if (depth !== 0) {
//                 snippets.push({
//                     text: StrGen.words(NumGen.int(20, 5)),
//                     depth: depth,
//                     index: idx, 
//                     parent: snippets[idx]
//                 })
//             } else {
//                 snippets.push({
//                     text: StrGen.words(NumGen.int(20, 5)),
//                     depth: depth,
//                     index: idx, 
//                     parent: null
//                 })
//             }
//         }
//     }
//     return snippets
// }