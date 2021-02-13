import { Pillar } from './pillar'

export type Node = {
    uid: number
    pos: Pos
    text: string
}

export class Pos {
    depth: number
    family: number
    index: number

    constructor(depth: number = 0, family: number = 0, index: number = 0) {
        this.depth = depth
        this.family = family
        this.index = index
    }

    isNull(): boolean {
        return this.depth === -1 && this.family === -1 && this.index === -1
    }

    isNotNull(): boolean {
        return !this.isNull()
    }

    static null(): Pos {
        return new Pos(-1, -1, -1)
    } 

    valid(): boolean {
        return this.depth >= 0 && this.family >= 0 && this.index >= 0
    }

    increment(): Pos {
        this.index++
        return this
    }

    decrement(): Pos {
        this.index--
        return this
    }

    string(): string {
        return "depth: " + this.depth + " family: " + this.family + " index: " + this.index
    }

    copy(): Pos {
        return new Pos(this.depth, this.family, this.index)
    }

    above(pillar: Pillar): Pos {
        // if there is a card in the same family directly above then return that
        if (this.index > 0) {
            return new Pos(this.depth, this.family, this.index - 1)
        }

        // start looping through the families above the pos
        let family = this.family - 1
        while (family >= 0) {
            if (pillar.families[family].isEmpty()) {
                family--
                continue
            }

            // if there is a family that is not empty then return the position
            // of the last card in the family
            let index = pillar.families[family].cards.length - 1
            return new Pos(this.depth, family, index)
        }

        return Pos.null()
    }

    below(pillar: Pillar): Pos {
        // if there is a card in the same family directly below then return that
        if (this.index < pillar.families[this.family].cards.length - 1) {
            return new Pos(this.depth, this.family, this.index + 1)
        }

        // find the first family below that is not empty and return that
        let family = this.family + 1
        while (family < pillar.families.length) {
            if (pillar.families[family].isEmpty()) {
                family++
                continue
            }

            return new Pos(this.depth, family, 0)
        }

        return Pos.null()
    }

}