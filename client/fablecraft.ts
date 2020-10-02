import { Story } from "./story";
import Axios from "axios";
// import Quill from 'quill';

window.onload = () => {
    console.log("Starting fablecraft");

    const loginData = {
        email: "test",
        password: "test",
    };
    // strictly used for testing create a user if we don't already have one
    Axios.post("/auth/login", loginData)
        .then(function (response) {
            console.log(response.data.token);
            const token = response.data.token;
            Axios.get("/api/stories/", { params: { token: token } })
                .then(function (response) {
                    console.log(response.data.stories);
                    let storyInfo = response.data.stories[0];
                    new Story(storyInfo.title, storyInfo.cards);
                })
                .catch(function (error) {
                    console.log(error);
                });
        })
        .catch(function (error) {
            console.log(error);
        });
};

export function getTextWidth(text: string, font: Font): number {
    // re-use canvas object for better performance
    var canvas = <HTMLCanvasElement>document.createElement("canvas");
    var context = canvas.getContext("2d");
    if (context === null) return 0;
    context.font = fontString(font);
    var metrics = context.measureText(text);
    return metrics.width;
}

type Font = {
    family: string;
    size: number;
    weight?: string;
};

function fontString(font: Font) {
    return font.size.toString() + "px " + font.family;
}
