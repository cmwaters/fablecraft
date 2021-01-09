import { Card } from '../model/card'
import { Vector, Size } from '../geometry'
import { RedomComponent, el, mount } from "redom";
import { Family } from './family';
import { Node } from './node';
import { Config } from '../config';

export class Pillar implements RedomComponent {
    el: HTMLElement;
    families: Family[] = [];
    nodes: Node[] = [];


    movement: NodeJS.Timeout
    tick: number
    frameRate: number = Config.window.refreshRate
    left: number;
    target: Vector;
    config: PillarConfig

    clearing: number = 150;

    constructor(parent: HTMLElement, cards: Card[], left: number, width: number, config: PillarConfig) {
        this.el = el("div.pillar", { style: { left: left, width: width} });
        mount(parent, this.el)
        this.left = left
        this.config = config
        let top = 0
        // first decide whether this is the root pillar
        if (!cards[0].parent) {
            // it is the root. Hence this pillar only supports a single family
            this.append(cards, top)
            console.log("family height: " + this.families[0].el.offsetHeight)
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
                    top += (family.el.offsetHeight + config.margin.card)
                }
            }
            // add the remaining cards together as a family
            this.append(cards.slice(priorIndex, cards.length), top)
        } 
    }

    set(familyIdx: number, desiredHeight: number) {
        this.families[familyIdx].set(desiredHeight)
    }

    // align loops through all the nodes of the parent pillar and
    // aligns any node that has children with the nodes in this pillar
    align(parent: Pillar) {
        let index = 0;
        let verticalPosition = parent.families[0].top
        console.log("starting position: " + verticalPosition)
        for (let i = 0; i < parent.nodes.length -1; i++) {
            let node = parent.nodes[i];
            if (node.children.length > 0) {
                console.log("node " + i + " has children")
                this.families[index].set(verticalPosition)
            }
            console.log(verticalPosition)
            verticalPosition += node.el.offsetHeight + this.config.margin.card
        }
    }

    append(cards: Card[], top: number): Family {
        let family = new Family(this.el, cards, top, this.config.margin.card)
        this.families.push(family)
        this.nodes.push(...family.nodes)
        mount(this.el, this.families[this.families.length - 1].el)
        return family
    }

    centerCard(index: number):number {
        let idx = 0;
        for (let i = 0; i < this.families.length; i++) {
            let length = this.families[i].nodes.length
            idx += length
            if (idx > index) {
                let offset = this.families[i].getCardOffset(idx - length + index)
                this.slideDown((this.el.offsetHeight / 2) - offset)
                return (this.el.offsetHeight / 2) - offset
            }
        }
    }

    centerFamily(index: number) {
        let idx = 0;
        let familyIdx = 0;
        for (let i = 0; i < this.families.length; i++) {
            let length = this.families[i].nodes.length
            idx += length
            if (idx > index) { 
                familyIdx = i
            }
        }

        console.log("center: " + this.el.clientHeight / 2)
        console.log(this.families[familyIdx].desired)
        let offset = this.families[familyIdx].desired - this.families[familyIdx].top
        console.log("centering family by: " + offset)
        this.families[familyIdx].slideDown(offset)
        if (offset > 0) {
            // the family went down we must push cards below and potentially pull cards above
            // first push cards below
            for (let i = familyIdx + 1; i < this.families.length; i++) {
                let delta = this.families[i].top - this.families[i-1].bottom + this.config.margin.family
                if (delta > 0) {
                    this.families[i].slideDown(delta)
                }
            }
            // then pull the cards above down if they want to go down
            for (let i = familyIdx - 1; i >= 0; i--) {
                let desiredDelta = this.families[i].desired - this.families[i].top
                let space = this.families[i + 1].top - (this.families[i].bottom + this.config.margin.family)
                this.families[i].slideDown(Math.min(desiredDelta, space)) 
            }
        } else {
            // the family went up so we must push cards above and potentially pull cards below
            // first push cards above
            for (let i = familyIdx - 1; i >= 0; i--) {
                let delta = this.families[i].top - (this.families[i-1].bottom + this.config.margin.family)
                if (delta < 0) {
                    this.families[i].slideDown(delta)
                }
            }
            // then pull the cards below up if they want to go up
            for (let i = familyIdx + 1; i < this.families.length; i++) {
                let desiredDelta = this.families[i].desired - this.families[i].top
                let space = this.families[i].top - (this.families[i - 1].bottom + this.config.margin.family)
                this.families[i].slideDown(Math.max(desiredDelta, space))
            }
        }
    }

    clearCenter() {
        console.log("height: " + this.el.offsetHeight)
        let centerTop = (this.el.offsetHeight - this.clearing)/2
        let centerBottom = (this.el.offsetHeight + this.clearing)/2
        let displaced = false
        for (let i = 0; i < this.families.length; i++) {
            console.log("center top: " + centerTop)
            console.log("family bottom: " + this.families[i].bottom)
            if (this.families[i].bottom > centerTop && this.families[i].top < centerBottom) {
                displaced = true
                if (this.families[i].top < centerTop) {
                    // slide upwards
                    this.families[i].slideDown(centerTop - this.families[i].bottom) 
                    for (let j = i - 1; j >= 0; j--) {
                        let delta = this.families[j].top - (this.families[j-1].bottom + this.config.margin.family)
                        if (delta < 0) {
                            this.families[j].slideDown(delta)
                        }
                    }
                    // pull cards below if they want to go up
                    for (let j = i + 1; j < this.families.length; j++) {
                        let desiredDelta = this.families[j].desired - this.families[j].top
                        let space = centerBottom - this.families[j].top
                        this.families[j].slideDown(Math.max(desiredDelta, space))
                    }
                } else {
                    // slide downwards
                    this.families[i].slideDown(centerBottom  - this.families[i].top)
                    for (let j = i + 1; j < this.families.length; j++) {
                        let delta = this.families[j].top - this.families[j-1].bottom + this.config.margin.family
                        if (delta > 0) {
                            this.families[j].slideDown(delta)
                        }
                    }
                    // pull cards above if they have the space
                    for (let j = i - 1; j >= 0; j--) {
                        let desiredDelta = this.families[j].desired - this.families[j].top
                        let space = centerTop - this.families[j].bottom
                        this.families[j].slideDown(Math.min(desiredDelta, space)) 
                    }
                }
                
            }
        }
        if (!displaced) {
            // pull cards below if they want to go up
            for (let j = 0; j < this.families.length; j++) {
                if (this.families[j].top > centerBottom) {
                    let desiredDelta = this.families[j].desired - this.families[j].top
                    let space = centerBottom - this.families[j].top
                    this.families[j].slideDown(Math.max(desiredDelta, space))
                    centerBottom = this.families[j].bottom + this.config.margin.family
                }
            }
            // pull cards above down if they want to go down
            for (let j = this.families.length - 1; j >= 0; j--) {
                if (this.families[j].bottom < centerTop) {
                    let desiredDelta = this.families[j].desired - this.families[j].top
                    let space = centerTop - this.families[j].bottom
                    this.families[j].slideDown(Math.min(desiredDelta, space)) 
                    centerTop = this.families[j].top
                }
            }
        }
    }

    // use a polynomial spline between current and target positions to move the pillar in a smooth manner
    shift(delta: Vector, periodMS: number) {
        if (periodMS === 0) {
            this.slideRight(delta.x)
            this.slideDown(delta.y)
        }
        let timeSteps = periodMS / this.frameRate
        let halfTimeSteps = timeSteps/2
        let constant = new Vector((delta.x/2) / (halfTimeSteps * halfTimeSteps), (delta.y/2)/ (halfTimeSteps * halfTimeSteps))
        console.log(constant)
        this.tick = 0;
        if (!this.movement) {
            this.movement = setInterval(() => {
                this.tick++
                if (this.tick > timeSteps) {
                    clearInterval(this.movement)
                    this.movement = null
                }
                if (this.tick > halfTimeSteps) {
                    let adjustedTick = halfTimeSteps - (this.tick % halfTimeSteps)
                    this.slideRight((constant.x * 2 * adjustedTick) - constant.x)
                    this.slideDown((constant.y * 2 * adjustedTick) - constant.y)
                } else {
                    this.slideRight((constant.x * 2 * this.tick) - constant.x)
                    this.slideDown((constant.y * 2 * this.tick) - constant.y)
                }
            }, this.frameRate)
        }
    }

    slideRight(deltaX: number): void {
        this.left += deltaX
        this.el.style.left = this.left + "px"
    }

    slideDown(deltaY: number): void {
        this.families.forEach(family => family.slideDown(deltaY))
    }

    resize(width: number) {
        this.el.style.width = width + "px"
    }

}

export type PillarConfig = {
    margin: {
        family: number,
        card: number
    }
}
