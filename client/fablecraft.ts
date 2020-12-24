import { Story } from "./story";
import Axios from "axios";
// import Quill from 'quill';

window.onload = () => {
    console.log("Starting fablecraft");

    const loginData = {
        email: "test@example.com",
        password: "test",
    };

    let id = ""
    
    // strictly used for testing create a user if we don't already have one
    Axios.post("/auth/login", loginData)
        .then(function (response) {
            console.log(response);
            const token = response.data.token;
            Axios.get("/api/story/last", { withCredentials: true })
                .then(function (response) {
                    console.log(response.data);
                    let storyInfo = response.data;
                    id = storyInfo._id
                    console.log("id: " + id)
                    
                    Axios.get("/api/cards/" + id, { withCredentials: true, data: { story: id }})
                        .then(function (response) {
                            console.log(response.data);
                            new Story(storyInfo.title, "", response.data, token, storyInfo._id);
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
