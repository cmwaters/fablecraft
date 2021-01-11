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


    movement: NodeJS.Timeout | null = null;
    tick: number = 0;
    frameRate: number = Config.window.refreshRate
    left: number;
    config: PillarConfig

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
                    parent = cards[index].parent!
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
                if (index > 0) {
                    let delta = (this.families[index -1].bottom + this.config.margin.family) - this.families[index].top
                    this.families[index].slideDown(Math.max(0, delta))
                }
                index++
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
                let offset = this.families[i].getCardOffset(index - (idx - length))
                this.slideDown((this.el.offsetHeight / 2) - offset)
                // this.families[i].desired = this.families[i].top
                return (this.el.offsetHeight / 2) - offset
            }
        }
        return 0
    }

    centerFamily(index: number) {
        let idx = 0;
        let familyIdx = -1;
        for (let i = 0; i < this.families.length; i++) {
            let length = this.families[i].nodes.length
            idx += length
            if (idx > index) { 
                familyIdx = i
                break
            }
        }

        console.log("center: " + this.el.clientHeight / 2)
        console.log("desired: " + this.families[familyIdx].desired)
        console.log("top: " + this.families[familyIdx].top)
        let offset = this.families[familyIdx].desired - this.families[familyIdx].top
        this.families[familyIdx].slideDown(offset)
        if (offset > 0) {
            console.log("sliding down")
            // the family went down we must push cards below and potentially pull cards above
            this.pushBelowDownwards(familyIdx)
        } else {
            console.log("sliding up")
            // the family went up so we must push cards above and potentially pull cards below
            this.pushAboveUpwards(familyIdx)
        }
        this.pullAboveDown(familyIdx)
        this.pullBelowUp(familyIdx)
    }

    clearCenter(clearance: number) {
        let centerTop = (this.el.offsetHeight - clearance)/2
        let centerBottom = (this.el.offsetHeight + clearance)/2
        let moved = false;
        for (let i = 0; i < this.families.length; i++) {
            if (this.families[i].bottom > centerTop && this.families[i].top < centerBottom) {
                moved = true;
                if (this.families[i].top < centerTop) {
                    // slide upwards
                    this.families[i].slideDown(centerTop - this.families[i].bottom) 
                    this.pushAboveUpwards(i)
                    this.pullBelowUp(i)
                } else {
                    // slide downwards
                    this.families[i].slideDown(centerBottom  - this.families[i].top)
                    this.pushBelowDownwards(i)
                    this.pullAboveDown(i)
                }
                
            }
        }
        if (!moved) {
            this.pullAboveDown(this.families.length, centerTop)
            // this.pullBelowUp(0, centerBottom)
        }
    }


    private pullAboveDown(index: number, floor?: number): void {
        if (!floor) {
            floor = this.families[index].top - this.config.margin.family
        }
        for (let j = index - 1; j >= 0; j--) {
            if (this.families[j].bottom < floor) {
                let desiredDelta = this.families[j].desired - this.families[j].top
                let space = floor - this.families[j].bottom
                this.families[j].slideDown(Math.min(desiredDelta, space)) 
                floor = this.families[j].top - this.config.margin.family
            }
        }
    }

    private pullBelowUp(index: number, ceiling?: number): void {
        if (!ceiling) {
            ceiling = this.families[index].bottom + this.config.margin.family
        }
        for (let j = index + 1; j < this.families.length; j++) {
            if (this.families[j].top > ceiling) {
                let desiredDelta = this.families[j].desired - this.families[j].top
                let space = ceiling - this.families[j].top
                this.families[j].slideDown(Math.max(desiredDelta, space))
                ceiling = this.families[j].bottom + this.config.margin.family
            }
        }
    }

    private pushAboveUpwards(index: number): void {
        for (let i = index - 1; i >= 0; i--) {
            let delta = this.families[i + 1].top - (this.families[i].bottom + this.config.margin.family)
            if (delta < 0) {
                this.families[i].slideDown(delta)
            }
        }
    }

    private pushBelowDownwards(index: number): void {
        for (let i = index + 1; i < this.families.length; i++) {
            let delta = this.families[i-1].bottom + this.config.margin.family - this.families[i].top
            if (delta > 0) {
                this.families[i].slideDown(delta)
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
        this.movement = setInterval(() => {
            this.tick++
            if (this.tick > timeSteps) {
                clearInterval(this.movement!)
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
