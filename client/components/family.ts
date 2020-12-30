import { RedomComponent } from "redom";
import { ViewComponent } from "./view_component";

export class Family implements RedomComponent, ViewComponent {
    el: HTMLElement;

    constructor() {

    }
    
    hasFocus(): boolean {
        throw new Error("Method not implemented.");
    }
    focus(): void {
        throw new Error("Method not implemented.");
    }
    blur(): void {
        throw new Error("Method not implemented.");
    }

}