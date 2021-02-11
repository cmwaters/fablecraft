import { Node, Pos } from './node'
import { Vector, Size } from './geometry'
import { RedomComponent, el, mount, unmount } from "redom";
import { Family } from './family';
import { PillarConfig, FamilyConfig } from './config'

export class Pillar implements RedomComponent {
    el: HTMLElement;
    families: Family[] = [];

    private center: number
    private familyConfig: FamilyConfig

    // used for moving the pillar
    private movement: NodeJS.Timeout | null = null;
    private tick: number = 0;
    private frameRate: number
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
        this.transitionTime = config.transitionTime
        this.frameRate = config.frameRate
    }

    // centerCard, centers the pillar around this card. The position of the card can be identified as either
    // purely based on index or a combination of both the family index and the index
    centerCard(family: number, index: number) {
        console.log("center card, index: " + index)
        let yOffset = this.target.y;
        for (let i = 0; i < family; i++) {
            // increment the height of the family as well as the margin
            yOffset += this.families[i].el.offsetHeight + this.familyConfig.margin
        }
        // calculate the offset of the card itself within the family
        yOffset += this.families[family].cardOffset(index) + this.familyConfig.margin
        this.shift(Vector.y(this.center - yOffset), this.transitionTime)
    }

    centerFamily(familyIndex: number) {
        let yOffset = this.target.y + this.familyConfig.margin
        for (let i = 0; i < familyIndex; i++) {
            console.log("family height " + i + ": " + this.families[i].el.offsetHeight)
            if (this.families[i].cards.length !== 0) {
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
            if (this.families[i].cards.length > 0) {
                yOffset += this.families[i].el.offsetHeight + this.familyConfig.margin
            }
        }
        yOffset += height/2 + this.familyConfig.margin
        this.shift(Vector.y(this.center - yOffset), this.transitionTime)
    }

    countCards(familyIndex: number = this.families.length): number {
        let index = 0
        if (familyIndex > this.families.length) {
            familyIndex = this.families.length
        }
        for (let i = 0; i < familyIndex; i++) {
            index += this.families[i].cards.length
        }
        return index
    }

    getFamilyAndIndex(cardIndex: number): {family: number , index: number } {
        let index = 0;
        for (let i = 0; i < this.families.length; i++) {
            if (cardIndex < index + this.families[i].cards.length) { 
                return { 
                    family: i,
                    index: cardIndex - index
                }
            }
            index += this.families[i].cards.length
        }
        throw new Error("card index " + cardIndex + " out of bounds")
    }

    insertFamily(index: number): void {
        if (index > this.families.length) {
            throw new Error("family index " + index + " greater than amount of families in pillar (" 
            + this.families.length + ")")
        }

        if (index === this.families.length) {
            return this.appendFamily()
        }

        let family = new Family(this.el, this.familyConfig, this.families[index])
        this.families.splice(index, 0, family)
    }

    appendFamily(): void {
        this.families.push(new Family(this.el, this.familyConfig))
    }

    // changes the width of the pillar and thus all the cards within
    changeWidth(width: number) {
        this.el.style.width = width + "px"
    }

    // deletes the entire family at the respective index. It then updates
    // the family index of all families below and returns an array of the deleted id's
    deleteFamily(familyIndex: number): number[] {
        if (familyIndex >= this.families.length) {
            throw new Error("deleting family with index out of bounds")
        }
        
        // add the id's
        let ids: number[] = []
        this.families[familyIndex].cards.forEach(card => ids.push(card.node.uid))

        // remove the family
        unmount(this.el, this.families[familyIndex])
        this.families.splice(familyIndex, 1)

        // slide all the families below up by one
        for (let i = familyIndex; i < this.families.length; i++) {
            this.families[i].shiftFamilyIndex(-1)
        }

        return ids
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
            if (this.families[i].cards.length > 0) {
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
        this.pos.setElement(this.el)
    }

    private moveTo(target: Vector): void {
        this.pos = target.copy()
        this.pos.setElement(this.el)
    }
    
}
