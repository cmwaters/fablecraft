import { Story } from "./story";
import Axios from "axios";
import { Controller } from "./controller";
import { Model } from "./model"
import { View } from "./view";
import { User } from "../models/user";
// import Quill from 'quill';

let model: Model
let view = new View()

window.onload = () => {
    console.log("Starting fablecraft");

    Controller.getUserProfile().then((user: User) => {
        Model.init(user).then((m: Model) => {
            model = m
        }).catch((err) => {
            console.log(err)
        })
    }).catch((err) => {
        if (err.response.status === 401) {
            view.login()
        }
    })


    // const loginData = {
    //     email: "test@example.com",
    //     password: "test",
    // };

    // let id = ""
    
    // // strictly used for testing create a user if we don't already have one
    // Axios.post("/auth/login", loginData)
    //     .then(function (response) {
    //         console.log(response);
    //         const token = response.data.token;
    //         Axios.get("/api/story/last", { withCredentials: true })
    //             .then(function (response) {
    //                 console.log(response.data);
    //                 let storyInfo = response.data;
    //                 id = storyInfo._id
    //                 console.log("id: " + id)
                    
    //                 Axios.get("/api/cards/" + id, { withCredentials: true, data: { story: id }})
    //                     .then(function (response) {
    //                         console.log(response.data);
    //                         new Story(storyInfo.title, storyInfo.description, response.data, token, storyInfo._id);
    //                     })
    //                     .catch(function (error) {
    //                         console.log(error);
    //                     });
    //             })
    //             .catch(function (error) {
    //                 console.log(error);
    //             });
                
    //     })
    //     .catch(function (error) {
    //         console.log(error);
    //     });
};
