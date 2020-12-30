import { Controller } from "./controller";
import { Model } from "./model/model"
import { View } from "./view"

window.onload = () => {
    let view = new View()
    let model = new Model(view)
    let controller = new Controller(model, view)
    controller.init()
};
