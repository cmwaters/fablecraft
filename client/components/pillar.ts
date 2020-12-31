import { Card } from '../../models/card'
import { RedomComponent } from "redom";
import { ViewComponent } from "./view_component";
import { Family } from './family';

export class Pillar implements RedomComponent, ViewComponent {
    el: HTMLElement;
    families: Family[] = [];

    constructor(cards: Card[]) {
        // first decide whether this is the root pillar
        if (!cards[0].parent) {
            // it is the root. Hence this pillar only supports a single family
            this.families = [new Family(cards)]
        }
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