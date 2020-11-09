import { Story } from "./story";
import Axios from "axios";
// import Quill from 'quill';

window.onload = () => {
    console.log("Starting fablecraft");

    const loginData = {
        email: "test",
        password: "test",
    };

    let id = ""
    
    // strictly used for testing create a user if we don't already have one
    Axios.post("/auth/login", loginData)
        .then(function (response) {
            console.log(response.data.token);
            const token = response.data.token;
            Axios.get("/api/stories/", { params: { token: token } })
                .then(function (response) {
                    console.log(response.data.stories);
                    let storyInfo = response.data.stories[0];
                    id = storyInfo._id
                    console.log("id: " + id)
                    new Story(storyInfo.title, "", storyInfo.cards, token, storyInfo._id);
                    Axios.get("/api/story/" + id, { params: { token: token } })
                        .then(function (response) {
                            console.log(response.data.story);
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                })
                .catch(function (error) {
                    console.log(error);
                });
                
        })
        .catch(function (error) {
            console.log(error);
        });
};

type Font = {
    family: string;
    size: number;
    weight?: string;
};

function fontString(font: Font) {
    return font.size.toString() + "px " + font.family;
}
