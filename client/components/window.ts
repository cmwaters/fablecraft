import { Card } from "../model/card";
import { CardPos } from "../model/model"
import { Size, Vector, Geometry } from "../geometry";
import { Config } from "../config";
import { Story, Node } from "../story";
import { Pillar } from "./pillar";
import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component"

let g = Geometry;
const inverseScrollSpeed = 2;

export class Window implements RedomComponent, ViewComponent {
    pillars: Pillar[] = [];
    el: HTMLElement;
    centerPoint: Vector;

    currentIndex: number = 0;
    currentDepth: number = 0;
    cardWidth: number = 0;
    // size: Size; represents the size of the view. Currently not used
    shiftMode: boolean = false;
    movementInterval: NodeJS.Timeout | null = null;
    listeningToClick: boolean = true;
    currentCard: Card;
    story: Story;

    // note that the view struct itself doesn't store the node data but passes them on to the respective cards to handle
    constructor(cards: Card[][], pos: Vector, size: Size) {
        console.log(cards)
        this.el = el("div.window", { style: { width: size.width, height: size.height, left: pos.x, top: pos.y}})
        this.cardWidth = this.calculateCardWidth();
        this.centerPoint = g.add(pos, g.center(size))
        console.log(this.centerPoint)
        console.log(this.cardWidth)

        window.onmousewheel = (e: WheelEvent) => {
            if (this.shiftMode) {
                this.shift({
                    x: -e.deltaY / inverseScrollSpeed,
                    y: -e.deltaX / inverseScrollSpeed,
                });
            } else {
                this.shift({
                    x: -e.deltaX / inverseScrollSpeed,
                    y: -e.deltaY / inverseScrollSpeed,
                });
            }
        };

        for (let i = 0; i < cards.length; i++) {
            console.log("creating a new pillar")
            this.pillars.push(new Pillar(cards[i], this.cardWidth, this.centerPoint.x))
            mount(this.el, this.pillars[this.pillars.length - 1].el)
        }
    }

    // resize centers the object again (we may want to change the card width in the future)
    resize(): void {
        console.log("resizing");
    }

    hasFocus(): boolean {
        return true;
    }

    // focus on this particular wiindow. Is relevant when we use split view
    focus(): void {
        // currently NOP
    }

    blur(): void {

    }

    center(card: CardPos) {

    }

    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.el.clientWidth, Config.card.width.min), Config.card.width.max);
    }

    // shift shifts the entire view by a delta vector. This is primarily
    // used to traverse along the tree an focus on different cards.
    // does not change the current depth and index
    shift(delta: Vector): void {
        this.pillars.forEach(p => p.shift(delta))
    }
}
