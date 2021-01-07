import { Card } from '../model/card'
import { Vector, Size, PIC } from '../geometry'
import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Family } from './family';
import { Node } from './node';
import { Config } from '../config';

export class Pillar implements RedomComponent, ViewComponent {
    el: HTMLElement;
    families: Family[] = [];
    nodes: Node[] = [];
    pos: Vector;
    movement: PIC
    target: Vector;
    config: PillarConfig

    constructor(cards: Card[], pos: Vector, width: number, config: PillarConfig) {
        this.el = el("div.pillar", { style: { left: pos.x, top: pos.y, width: width} });
        this.pos = pos
        this.movement = new PIC(this.pos, (pos: Vector) => {
            this.el.style.left = pos.x + "px"
            this.el.style.top = pos.y + "px"
        }, Config.window.refreshRate, 0.15, 0.0005)
        this.config = config
        let top = 0
        // first decide whether this is the root pillar
        if (!cards[0].parent) {
            // it is the root. Hence this pillar only supports a single family
            this.append(cards, top)
        } else {
            // divide the pillar based on slices of cards that share the same parent (i.e. a Family)
            let parent = cards[0].parent
            let priorIndex = 0;
            for (let index = 0; index < cards.length; index++) {
                if (cards[index].parent !== parent) {
                    // add the family from the slice
                    let family = this.append(cards.slice(priorIndex, index), top)
                    // reset the index and parent
                    priorIndex = index
                    parent = cards[index].parent
                    top += (family.height() + config.margin.card)
                }
            }
            // add the remaining cards together as a family
            this.append(cards.slice(priorIndex, cards.length), top)
        } 
    }

    append(cards: Card[], top: number): Family {
        let family = new Family(cards, top, this.config.margin.card)
        this.families.push(family)
        this.nodes.push(...family.nodes)
        mount(this.el, this.families[this.families.length - 1].el)
        return family
    }

    shift(delta: Vector) {
        this.movement.shift(delta)
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