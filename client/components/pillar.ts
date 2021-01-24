import { Card } from '../model/card'
import { Vector, Size } from '../geometry'
import { RedomComponent, el, mount } from "redom";
import { Family, FamilyConfig } from './family';
import { Node } from './node';
import { Config } from '../config';
import e from 'express';

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
        this.el = el("div.pillar", { style: { left: xOffset, width: config.width } });
        mount(parent, this.el)
        this.pos = new Vector(xOffset, 0)
        this.center = config.center
        this.familyConfig = config.family
    }

    // centerCard, centers the pillar around this card. The position of the card can be identified as either
    // purely based on index or a combination of both the family index and the index
    centerCard(index: number) {
        console.log("center card, index: " + index)
        let yOffset = this.el.offsetTop;
        let i = 0;
        let familyIndex = 0;
        while (i <= index) {
            // check if family is empty in which case we skip
            if (this.families[familyIndex].nodes.length === 0) {
                familyIndex++
                continue
            }

            // termination condition: is the card of the index within this family
            if (index - i < this.families[familyIndex].nodes.length) {
                break
            }

            // increment the height of the family as well as the margin
            yOffset += this.families[familyIndex].el.offsetHeight + this.familyConfig.margin
            i += this.families[familyIndex].nodes.length
            familyIndex++
        }
        // calculate the offset of the card itself within the family
        console.log(yOffset)
        console.log(familyIndex)
        yOffset += this.families[familyIndex].cardOffset(index - i) + this.familyConfig.margin
        console.log(yOffset)
        this.move(Vector.y(this.center - yOffset))
    }

    centerFamily(familyIndex: number) {
        let yOffset = this.el.offsetTop + this.familyConfig.margin
        for (let i = 0; i < familyIndex; i++) {
            console.log("family height " + i + ": " + this.families[i].el.offsetHeight)
            if (this.families[i].nodes.length !== 0) {
                yOffset += this.families[i].el.offsetHeight + this.familyConfig.margin
            }
        }
        yOffset += this.families[familyIndex].el.offsetHeight / 2
        this.move(Vector.y(this.center - yOffset))
    }

    // centers on the card that would 
    centerBegin(height: number) {
        console.log("center begin")
        let yOffset = this.el.offsetTop + (height / 2) + this.familyConfig.margin
        this.move(Vector.y(this.center - yOffset))
    }

    // centers on the card that would be appended to the end of the pillar.
    // height refers to the height of the parent
    centerEnd(height: number) {
        console.log("center end: " + height)
        let yOffset = this.el.offsetTop
        for (let i = 0; i < this.families.length; i++) {
            if (this.families[i].nodes.length > 0) {
                yOffset += this.families[i].el.offsetHeight + this.familyConfig.margin
            }
        }
        yOffset += height/2 + this.familyConfig.margin
        this.move(Vector.y(this.center - yOffset))
    }

    getFamilyIndex(cardIndex: number) {
        let idx = 0;
        for (let i = 0; i < this.families.length; i++) {
            let length = this.families[i].nodes.length
            idx += length
            if (idx > cardIndex) {
                return i
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

    // changes the width of the pillar and thus all the cards within
    changeWidth(width: number) {
        this.el.style.width = width + "px"
    }

    // use a polynomial spline between current and target positions to move the pillar in a smooth manner
    shift(delta: Vector, periodMS: number) {
        if (periodMS === 0) {
            this.move(delta)
        }
        let timeSteps = periodMS / this.frameRate
        let halfTimeSteps = timeSteps / 2
        let constant = new Vector((delta.x / 2) / (halfTimeSteps * halfTimeSteps), (delta.y / 2) / (halfTimeSteps * halfTimeSteps))
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

    // isEmpty checks to see if a range of families are empty
    // if and end is not provided then isEmpty searches until the end.
    // toIdx is exclusive.
    isEmpty(fromIdx: number, toIdx?: number): boolean {
        if (!toIdx) toIdx = this.families.length
        for (let i = fromIdx; i < toIdx; i++) {
            if (this.families[i].nodes.length > 0) {
                return false
            }
        }
        return true
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
