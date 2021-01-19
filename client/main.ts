import { Controller } from "./controller";
import { View } from "./view"

window.onload = () => {
    new Controller(new View())
};
