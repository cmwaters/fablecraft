import { Card } from '../model/card'
import { Vector, Size, Geometry } from '../geometry'
import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Family } from './family';

export class Pillar implements RedomComponent, ViewComponent {
    el: HTMLElement;
    families: Family[] = [];
    pos: Vector;

    constructor(cards: Card[], pos: Vector, width: number, config: PillarConfig) {
        this.el = el("div.pillar", { style: { left: pos.x, top: pos.y, width: width} });
        this.pos = pos
        let top = 0
        // first decide whether this is the root pillar
        if (!cards[0].parent) {
            // it is the root. Hence this pillar only supports a single family
            this.families = [new Family(cards, top, config.margin.card)]
            mount(this.el, this.families[0].el)
        } else {
            // divide the pillar based on slices of cards that share the same parent (i.e. a Family)
            let parent = cards[0].parent
            let priorIndex = 0;
            for (let index = 0; index < cards.length; index++) {
                if (cards[index].parent !== parent) {
                    let family = new Family(cards.slice(priorIndex, index), top, config.margin.card)
                    this.families.push(family)
                    priorIndex = index
                    parent = cards[index].parent
                    top += (family.height() + config.margin.card)
                    mount(this.el, this.families[this.families.length - 1].el)
                }
            }
            // add the remaining cards together as a family
            this.families.push(new Family(cards.slice(priorIndex, cards.length), top, config.margin.card))
            mount(this.el, this.families[this.families.length - 1].el)
        }   
    }

    shift(delta: Vector) {
        this.pos = Geometry.add(this.pos, delta)
        this.el.style.left = this.pos.x + "px"
        this.el.style.top = this.pos.y + "px"
    }

    resize(width: number) {
        this.el.style.width = width + "px"
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

export type PillarConfig = {
    margin: {
        family: number,
        card: number
    }
}