import { Card } from '../../models/card'
import { RedomComponent } from "redom";
import { ViewComponent } from "./view_component";

export class Pillar implements RedomComponent, ViewComponent {
    el: HTMLElement;

    constructor(cards: Card[]) {

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