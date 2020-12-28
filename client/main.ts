import { Controller } from "./controller";
import { Model } from "./model"
import { View } from "./view"

window.onload = () => {
    let view = new View()
    let model = new Model(view)
    new Controller(model, view)
};
