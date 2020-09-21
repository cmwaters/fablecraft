import { PaperScope, Path, Color, Point, Size, Rectangle, Layer, PointText, Group } from "paper";
import { Story, Snippet } from './story'
import Axios from "axios";

const paper = new PaperScope()
window.onload = () => {
    console.log("Starting fablecraft")
    console.log(window.devicePixelRatio)
    paper.install(window)
    const canvas = document.createElement('canvas')
    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight
    document.body.appendChild(canvas)
    
    var ctx = canvas.getContext("2d");
    if (ctx !== null) {
        ctx.translate(0.5, 0.5);
    }
    paper.setup(canvas);

    const loginData = {
        email: 'test',
        password: 'test'
    }
    // strictly used for testing create a user if we don't already have one
    Axios.post('/auth/login', loginData)
    .then(function (response) {
        const token = response.data.token
        Axios.get('/api/story/5f64b0fce3c7cf20ac86339e/', { params: { token: token }})
        .then(function (response) {
            console.log(response.data)
            let story = new Story(response.data.story.title, paper.project, response.data.story.cards)
        })
        .catch(function (error) {
            console.log(error)
        })
    })
    .catch(function (error) {
        console.log(error);
    });

    
    
    window.addEventListener("resize", () => {
        canvas.width = document.body.clientWidth
        canvas.height = document.body.clientHeight
    })

}
