import { PaperScope, Path, Color, Point, Size, Rectangle, Layer, PointText, Group } from "paper";
import { Story, Snippet } from "./story";
import { StrGen, NumGen } from "./libs/rand";
import Axios from "axios";

const paper = new PaperScope();
window.onload = () => {
    console.log("Starting fablecraft");
    console.log(window.devicePixelRatio);
    paper.install(window);
    const canvas = document.createElement("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    if (ctx !== null) {
        ctx.translate(0.5, 0.5);
    }
    paper.setup(canvas);

    const loginData = {
        email: "test",
        password: "test",
    };
    // strictly used for testing create a user if we don't already have one
    Axios.post("/auth/login", loginData)
        .then(function (response) {
            console.log(response.data.token);
            const token = response.data.token;
            Axios.get("/api/story/5f68b47773ea6658a5cf5617/", { params: { token: token } })
                .then(function (response) {
                    console.log(response.data);
                    let story = new Story(response.data.story.title, paper.project, [{text: "Essentially the problem is that the Genesis State does not contain a header, though it does have a timestamp and an initial validator set. We should still be able to initialize from it - we can consider it height 0.", depth: 1, index: 1, parentIndex: null}]);
                })
                .catch(function (error) {
                    console.log(error);
                });
        })
        .catch(function (error) {
            console.log(error);
        });

    window.addEventListener("resize", () => {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
    });
};
