import { Card } from '../model/card'
import { Vector, Size } from '../geometry'
import { v4 as uuidv4 } from 'uuid';
import { RedomComponent, el, mount, unmount } from "redom";
import { Family, FamilyConfig } from './family';
import { Node } from './node';
import * as gConfig from '../config.json';

export class Pillar implements RedomComponent {
    el: HTMLElement;
    families: Family[] = [];
    nodes: Node[] = [];

    private center: number
    private familyConfig: FamilyConfig

    // used for moving the pillar
    private movement: NodeJS.Timeout | null = null;
    private tick: number = 0;
    private frameRate: number = gConfig.window.refreshRate
    private pos: Vector
    private alpha: Vector
    private transitionTime: number
    private target: Vector

    constructor(parent: HTMLElement, xOffset: number, config: PillarConfig) {
        this.el = el("div.pillar", { style: { left: xOffset, width: config.width } });
        mount(parent, this.el)
        this.pos = new Vector(xOffset, 0)
        this.target = this.pos.copy()
        this.center = config.center
        this.familyConfig = config.family
        this.transitionTime = config.transition
    }

    // centerCard, centers the pillar around this card. The position of the card can be identified as either
    // purely based on index or a combination of both the family index and the index
    centerCard(index: number) {
        console.log("center card, index: " + index)
        let yOffset = this.target.y;
        let i = 0;
        let familyIndex = 0;
        while (i <= index) {
            if (familyIndex === this.families.length) [
                console.error("center card: family index exceeds length. Index: " + familyIndex)
            ]
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
        yOffset += this.families[familyIndex].cardOffset(index - i) + this.familyConfig.margin
        this.shift(Vector.y(this.center - yOffset), this.transitionTime)
    }

    centerFamily(familyIndex: number) {
        let yOffset = this.target.y + this.familyConfig.margin
        for (let i = 0; i < familyIndex; i++) {
            console.log("family height " + i + ": " + this.families[i].el.offsetHeight)
            if (this.families[i].nodes.length !== 0) {
                yOffset += this.families[i].el.offsetHeight + this.familyConfig.margin
            }
        }
        yOffset += this.families[familyIndex].el.offsetHeight / 2
        this.shift(Vector.y(this.center - yOffset), this.transitionTime)
    }

    // centers on the card that would 
    centerBegin(height: number) {
        console.log("center begin")
        let yOffset = this.target.y + (height / 2) + this.familyConfig.margin
        this.shift(Vector.y(this.center - yOffset), this.transitionTime)
    }

    // centers on the card that would be appended to the end of the pillar.
    // height refers to the height of the parent
    centerEnd(height: number) {
        console.log("center end: " + height)
        let yOffset = this.target.y
        for (let i = 0; i < this.families.length; i++) {
            if (this.families[i].nodes.length > 0) {
                yOffset += this.families[i].el.offsetHeight + this.familyConfig.margin
            }
        }
        yOffset += height/2 + this.familyConfig.margin
        this.shift(Vector.y(this.center - yOffset), this.transitionTime)
    }

    getFamilyIndex(cardIndex: number): {familyIndex: number, cardIndex: number} {
        let idx = 0;
        for (let i = 0; i < this.families.length; i++) {
            let length = this.families[i].nodes.length
            idx += length
            if (idx > cardIndex) {
                return {
                    familyIndex: i,
                    cardIndex: cardIndex - (idx - length),
                }
            }
        }
        return {
            familyIndex: this.families.length,
            cardIndex: 0
        }
    }

    getCardIndex(familyIndex: number): number {
        let index = 0
        if (familyIndex >= this.families.length) {
            familyIndex = this.families.length - 1
        }
        for (let i = 0; i < familyIndex; i++) {
            index += this.families[i].nodes.length
        }
        return index
    }

    insertFamily(index: number, cards: Card[] = []): Family {
        let family = new Family(this.el, cards, this.familyConfig, this.families[index])
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

    insertCardAbove(index: number): string {
        let { familyIndex, cardIndex } = this.getFamilyIndex(index)
        let node = this.families[familyIndex].insertCardAbove(cardIndex)
        this.nodes.splice(index, 0, node)
        // use uuid to generate a random id as a proxy for the card
        // TODO use an incrementing numerated index instead of a string
        // one with which to index the cards
        node.id = uuidv4()
        return node.id 
    }

    appendCard(familyIndex: number = this.families.length - 1, parent?: string): { id: string, index: number } {
        let { node, index } = this.families[familyIndex].appendCard(parent)
        // append to the nodes array
        if (familyIndex < this.families.length - 1) {
            index += this.getCardIndex(familyIndex)
            this.nodes.splice(index, 0, node)
        } else {
            this.nodes.push(node)
        }
        // use uuid to generate a random id as a proxy for the card
        // TODO use an incrementing numerated index instead of a string
        // one with which to index the cards
        node.id = uuidv4()
        return { id: node.id, index: index }
    }

    // changes the width of the pillar and thus all the cards within
    changeWidth(width: number) {
        this.el.style.width = width + "px"
    }

    // deletes the card at the respective index
    deleteCard(index: number) {
        let { familyIndex, cardIndex } = this.getFamilyIndex(index)
        this.families[familyIndex].deleteCard(cardIndex)
        this.nodes.splice(index, 1)
    }

    // deletes the entire family at the respective index
    deleteFamily(familyIndex: number) {
        unmount(this.el, this.families[familyIndex])
        let cardIndex = this.getCardIndex(familyIndex)
        this.nodes.splice(cardIndex, this.families[familyIndex].nodes.length)
        this.families.splice(familyIndex, 1)
    }

    // use a polynomial spline between current and target positions to move the pillar in a smooth manner
    // should be able to handle concurrent requests
    shift(delta: Vector, periodMS: number = 0) {
        this.target.shift(delta)
        // if period is 0 the pillar jumps immediately to the target
        if (periodMS === 0) {
            this.moveTo(this.target)
            return 
        }
        // if we were already performing a shift operation then we stop this one
        // and calculate a new one (this should incorporate prior shifts)
        if (this.movement) {
            clearInterval(this.movement!)
            this.movement = null
            this.alpha = new Vector()
        }

        let actualDelta = this.target.subtract(this.pos)
        let timeSteps = periodMS / this.frameRate
        let halfTimeStepsSquared = (timeSteps / 2) * (timeSteps / 2)
        this.alpha = new Vector((actualDelta.x / 2) / halfTimeStepsSquared, (actualDelta.y / 2) / halfTimeStepsSquared)
        this.tick = 0;
        
        this.movement = setInterval(() => {
            this.tick++
            // termination condition. Once the sufficient incremental steps are
            // taken we should have reached the target
            if (this.tick > timeSteps) {
                if (!this.target.subtract(this.pos).isLessThan(new Vector(1, 1))) {
                    console.error("move operation failed to reach target after required ticks. Target: " + this.target.string() + " Current: " + this.pos.string())
                }
                // this.moveTo(this.target)
                clearInterval(this.movement!)
                this.movement = null
                return
            }

            // split the journey in two. On the front half we speed up and on the
            // the back half we slow down
            if (this.tick > (timeSteps / 2)) {
                let adjustedTick = (timeSteps / 2) - (this.tick % (timeSteps / 2))
                let step = this.alpha.multiply(2).multiply(adjustedTick).subtract(this.alpha)
                this.moveBy(step)
            } else {
                let step = this.alpha.multiply(2).multiply(this.tick).subtract(this.alpha)
                this.moveBy(step)
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

    resize(width: number) {
        this.el.style.width = width + "px"
    }

    private moveBy(delta: Vector): void {
        this.pos.shift(delta)
        this.pos.updateEl(this.el)
    }

    private moveTo(target: Vector): void {
        this.pos = target.copy()
        this.pos.updateEl(this.el)
    }
    
}

export type PillarConfig = {
    family: FamilyConfig
    width: number,
    center: number
    transition: number
}
