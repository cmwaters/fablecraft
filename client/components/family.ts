import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Node } from "./node";
import { Card } from "../model/card";
import { Vector } from '../geometry'
import { Config } from "../config"

export class Family implements RedomComponent {
    el: HTMLElement;
    top: number
    desired: number
    bottom: number
    margin: number
    // movement: PIC
    nodes: Node[] = [];

    // we don't know the height up front. This must be calculated by creating
    // all the cards and returning the height so that the pillar controlling
    // the family can position it appropriately.
    constructor(parent: HTMLElement, cards: Card[], top: number, margin: number) {
        this.el = el("div.family", { style: { top: top}})
        mount(parent, this.el)
        cards.forEach((card) => {
            let node = new Node(this.el, card, margin)
            this.nodes.push(node)
            mount(this.el, node.el)
        })
        this.margin = margin
        this.top = top
        this.desired = top
        this.bottom = top + this.el.clientHeight
    }

    slideDown(deltaY: number) {
        this.top += deltaY
        this.el.style.top = this.top + "px"
        this.bottom += deltaY
    }

    set(target: number) {
        this.desired = target
        this.slideDown(target - this.top)
    }

    getCardOffset(index: number) {
        let offset = this.top
        for (let i = 0; i < index; i++) {
            offset += this.nodes[i].el.offsetHeight + this.margin
        }
        return offset + this.nodes[index].el.offsetHeight/2
    }

}
