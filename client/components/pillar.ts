import { Card } from '../model/card'
import { Vector, Size } from '../geometry'
import { RedomComponent, el, mount } from "redom";
import { Family, FamilyConfig } from './family';
import { Node } from './node';
import { Config } from '../config';

export class Pillar implements RedomComponent {
    el: HTMLElement;
    families: Family[] = [];
    nodes: Node[] = [];

    movement: NodeJS.Timeout | null = null;
    tick: number = 0;
    frameRate: number = Config.window.refreshRate
    pos: Vector
    center: number
    familyConfig: FamilyConfig

    constructor(parent: HTMLElement, xOffset: number, config: PillarConfig) {
        this.el = el("div.pillar", { style: { left: xOffset, width: config.width} });
        mount(parent, this.el)
        this.pos = new Vector(xOffset, 0)
        this.center = config.center
        this.familyConfig = config.family
    }

    centerCard(index: number) {
        let yOffset = this.el.offsetTop;
        for (let i = 0; i < index; i++) {
            yOffset += this.families[i].el.offsetHeight
        }
        this.move(Vector.y(this.center - yOffset))
    }

    getFamilyIndex(cardIndex: number) {
        let idx = 0;
        for (let i = 0; i < this.families.length; i++) {
            let length = this.families[i].nodes.length
            idx += length
            if (idx > cardIndex) { 
                return i
                break
            }
        }
        return -1
    }

    insertFamily(index: number, cards: Card[] = []): Family {
        let family = new Family(this.el, cards, this.familyConfig)
        this.families.splice(index, 0, family)
        let cardIndex = 0;
        for (let i = 0; i < index; i++) {
            cardIndex += this.families[i].nodes.length
        }
        this.nodes.splice(cardIndex, 0, ...family.nodes)
        return family
    }

    appendFamily(cards: Card[] = []): Family {
        let family = new Family(this.el, cards, this.familyConfig)
        this.families.push(family)
        this.nodes.push(...family.nodes)
        return family
    }

    // use a polynomial spline between current and target positions to move the pillar in a smooth manner
    shift(delta: Vector, periodMS: number) {
        if (periodMS === 0) {
            this.move(delta)
        }
        let timeSteps = periodMS / this.frameRate
        let halfTimeSteps = timeSteps/2
        let constant = new Vector((delta.x/2) / (halfTimeSteps * halfTimeSteps), (delta.y/2)/ (halfTimeSteps * halfTimeSteps))
        console.log(constant)
        this.tick = 0;
        this.movement = setInterval(() => {
            this.tick++
            if (this.tick > timeSteps) {
                clearInterval(this.movement!)
                this.movement = null
            }
            if (this.tick > halfTimeSteps) {
                let adjustedTick = halfTimeSteps - (this.tick % halfTimeSteps)
                this.move(constant.multiply(2).multiply(adjustedTick).subtract(constant))
            } else {
                this.move(constant.multiply(2).multiply(this.tick).subtract(constant))
            }
        }, this.frameRate)
    }

    move(delta: Vector): void {
        this.pos.shift(delta)
        this.el.style.left = this.pos.x + "px"
        this.el.style.top = this.pos.y + "px"
    }

    resize(width: number) {
        this.el.style.width = width + "px"
    }
}

export type PillarConfig = {
    family: FamilyConfig
    width: number,
    center: number
}
