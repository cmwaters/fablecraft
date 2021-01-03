import { Card } from '../../models/card'
import { Config } from '../config'
import { Vector } from '../geometry'
import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Family } from './family';

export class Pillar implements RedomComponent, ViewComponent {
    el: HTMLElement;
    gap = Config.view.margin.height;
    families: Family[] = [];

    constructor(cards: Card[], cardWidth: number, yAxis: number) {
        this.el = el("div.pillar", { style: { left: yAxis - (cardWidth / 2), width: cardWidth }})
        // first decide whether this is the root pillar
        if (!cards[0].parent) {
            // it is the root. Hence this pillar only supports a single family
            this.families = [new Family(cards)]
            mount(this.el, this.families[0].el)
        } else {
            // divide the pillar based on slices of cards that share the same parent (i.e. a Family)
            let parent = cards[0].parent
            let priorIndex = 0;
            for (let index = 0; index < cards.length; index++) {
                if (cards[index].parent !== parent) {
                    let family = new Family(cards.slice(priorIndex, index))
                    this.families.push(family)
                    priorIndex = index
                    parent = cards[index].parent
                    mount(this.el, this.families[this.families.length - 1].el)
                }
            }
            // add the remaining cards together as a family
            this.families.push(new Family(cards.slice(priorIndex, cards.length)))
            mount(this.el, this.families[this.families.length - 1].el)
        }   
    }

    shift(delta: Vector) {

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