import { Card } from "../model/card";
import { CardPos } from "../model/model"
import { Size, Vector } from "../geometry";
import { Pillar } from "./pillar";
import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component"
import { Node } from './node'

export class Window implements RedomComponent, ViewComponent {
    pillars: Pillar[] = [];
    el: HTMLElement;
    centerPoint: Vector;
    config: WindowConfig

    cardWidth: number = 0;
    current: CardPos = { depth: 0, index: 0};

    // note that the view struct itself doesn't store the node data but passes them on to the respective cards to handle
    constructor(cards: Card[][], pos: Vector, size: Size, config: WindowConfig) {
        this.config = config;
        this.el = el("div.window", { style: { width: size.width, height: size.height, left: pos.x, top: pos.y}})
        this.cardWidth = this.calculateCardWidth();
        this.centerPoint = pos.add(size.center())
        console.log(this.centerPoint)
        console.log(this.cardWidth)

        let pillarConfig = { 
            margin: { 
                family: config.margin.family, 
                card: config.margin.card
            }
        }
        for (let i = 0; i < cards.length; i++) {
            console.log("creating a new pillar")
            let pillarPos = Vector.x(this.centerPoint.x - this.cardWidth/2 + (i * (this.cardWidth + this.config.margin.pillar)))
            let pillar = new Pillar(cards[i], pillarPos , this.cardWidth, pillarConfig)
            let height = pillar.nodes[0].height()
            pillar.shift(new Vector(0, this.centerPoint.y - height/2))
            this.bind(this.pillars[this.pillars.length - 1], pillar)
            this.pillars.push(pillar)
            mount(this.el, pillar.el)
        }
    }

    // resize centers the object again (we may want to change the card width in the future)
    resize(): void {
        console.log("resizing");
    }

    hasFocus(): boolean {
        return true;
    }

    // focus on this particular window. It is relevant when we use split view
    focus(): void {
        // currently NOP
    }

    blur(): void {

    }

    node(depth?: number, index?: number): Node {
        if (!depth) depth = this.current.depth
        if (!index) index = this.current.index
        return this.pillars[depth].nodes[index]
    }

    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.el.clientWidth, this.config.card.width.min), this.config.card.width.max);
    }

    // shift shifts the entire view by a delta vector. This is primarily
    // used to traverse along the tree an focus on different cards.
    // does not change the current depth and index
    shift(delta: Vector): void {
        this.pillars.forEach(p => p.shift(delta))
    }

    bind(parent: Pillar, child: Pillar): void {

    }

    switch(depth: number, index: number) {

    }

    down() {
        console.log("down")
        // check that the card is not the last in the pillar
        if (this.current.index < this.pillars[this.current.depth].nodes.length - 1) {
            let delta = this.node().height()/2
            delta += this.config.margin.card
            this.current.index++
            delta += this.node().height()/2
            this.pillars[this.current.depth].shift(Vector.y(-delta))
        }
    }
    
    up() {
        console.log("up")

    }

    left() {
        console.log("left")

    }

    right() {
        console.log("right")

    }
}

export type WindowConfig = {
    margin: {
        pillar: number,
        family: number, 
        card: number
    }
    card: {
        width: {
            min: number, 
            max: number
        }
    }
}
