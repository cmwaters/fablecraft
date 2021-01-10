import { Card } from "../model/card";
import { CardPos } from "../model/model";
import { Size, Vector } from "../geometry";
import { Pillar } from "./pillar";
import { RedomComponent, el, mount } from "redom";
import { ViewComponent } from "./view_component";
import { Node } from "./node";

export class Window implements RedomComponent, ViewComponent {
    pillars: Pillar[] = [];
    pillar: Pillar;
    el: HTMLElement;
    reference: HTMLElement;
    centerPoint: Vector;
    config: WindowConfig;
    cardIndexer: {
        [index: string]: {
            depth: number;
            index: number;
        };
    } = {};

    cardWidth: number = 0;
    current: CardPos = { depth: 0, index: 0 };
    node: Node;

    // note that the view struct itself doesn't store the node data but passes them on to the respective cards to handle
    constructor(parent: HTMLElement, cards: Card[][], pos: Vector, size: Size, config: WindowConfig) {
        this.config = config;
        this.el = el("div.window", { style: { width: size.width, height: size.height, left: pos.x, top: pos.y } });
        mount(parent, this.el);
        this.reference = el("div.reference");
        mount(this.el, this.reference);
        this.cardWidth = this.calculateCardWidth();
        this.centerPoint = pos.add(size.center());

        let pillarConfig = {
            margin: {
                family: config.margin.family,
                card: config.margin.card,
            },
        };
        for (let i = 0; i < cards.length; i++) {
            // add a pillar
            let left = this.centerPoint.x - this.cardWidth / 2 + i * (this.cardWidth + this.config.margin.pillar);
            let pillar = new Pillar(this.reference, cards[i], left, this.cardWidth, pillarConfig);
            if (this.pillars.length > 0) {
                pillar.align(this.pillars[this.pillars.length - 1]);
            }
            this.pillars.push(pillar);

            // set on click events
            pillar.nodes.forEach(node => node.el.onclick = () => {
                this.focusOnCardById(node.id)
            })

            // index the cards by id
            for (let j = 0; j < cards[i].length; j++) {
                this.cardIndexer[cards[i][j]._id] = {
                    depth: i,
                    index: j,
                };
            }
        }
        this.pillar = this.pillars[0]
        this.node = this.pillar.nodes[0];
        this.focusOnCard(this.current.depth, this.current.index)
    }

    focusOnCardById(id: string) {
        let pos = this.cardIndexer[id];
        this.focusOnCard(pos.depth, pos.index);
    }

    focusOnCard(depth: number, index: number): void {
        // unlock on the previous card
        this.node.blur()

        // if the user has moved off the origin then reset the screen
        // back to the reference point
        this.resetReference();

        // if there has been a change in depth then move the pillars across
        if (depth !== this.current.depth) {
            let deltaX =  (this.current.depth - depth) * (this.cardWidth + this.config.margin.pillar)
            this.pillars.forEach(pillar => pillar.slideRight(deltaX))
            for (let i = depth; i < this.current.depth; i++) {
                this.pillars[i+1].align(this.pillars[i])
            }
        }

        // update and focus on the new card
        this.current.depth = depth;
        this.current.index = index;
        this.node = this.pillars[depth].nodes[index];
        this.pillar = this.pillars[this.current.depth]
        this.node.focus()
        
        // shift the current pillar to vertically center on the locked card
        let offset = this.pillars[depth].centerCard(index);

        // shift the pillars to the left vertically so that the parent is
        // directly in line with the locked on card
        this.adjustAncestorPillars(depth, index)
        
        // shift all the pillars to the right vertically so that the
        // children of the current card are aligned.
        this.adjustOffspringPillars(depth, index, offset)
    }

    private adjustAncestorPillars(depth: number, index: number) {
        for (let i = depth - 1; i >= 0; i--) {
            let parentId = this.pillars[i + 1].nodes[index].parent!;
            console.log("parent: " + parentId)
            index = this.cardIndexer[parentId].index;
            this.pillars[i].centerCard(index);
        }
    }

    private adjustOffspringPillars(depth: number, index: number, offset: number) {
        console.log("offset: " + offset)
        console.log("desired: " + this.pillars[1].families[0].desired)
        console.log("top: " + this.pillars[1].families[0].top)
        for (let i = depth + 1; i < this.pillars.length; i++) {
            this.pillars[i].slideDown(offset);
            this.pillars[i].families.forEach((family) => {family.desired += offset});
            console.log("slide")
            console.log("desired: " + this.pillars[1].families[0].desired)
            console.log("top: " + this.pillars[1].families[0].top)
            if (this.pillars[i - 1].nodes[index].children.length === 0) {
                if (i === depth + 1) {
                    console.log("no children, clearing center");
                    this.pillars[i].clearCenter();
                }
                break;
            }
            let childrenId = this.pillars[i - 1].nodes[index].children[0];
            index = this.cardIndexer[childrenId].index;
            console.log("children: " + index)
            this.pillars[i].centerFamily(index);
        }
        console.log("desired: " + this.pillars[1].families[0].desired)
        console.log("top: " + this.pillars[1].families[0].top)
    }

    resetReference() {
        this.reference.style.left = "0px";
        this.reference.style.top = "0px";
    }

    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.el.clientWidth, this.config.card.width.min), this.config.card.width.max);
    }

    // pan moves the view of the window. It does not displace any of the cards individually rather
    // moves everything uniformly
    pan(delta: Vector): void {
        this.reference.style.left = this.reference.offsetLeft + delta.x + "px";
        this.reference.style.top = this.reference.offsetTop + delta.y + "px";
    }

    edit(): void {
        this.node.editor.focus()
    }

    down() {
        if (this.current.index < this.pillars[this.current.depth].nodes.length - 1) {
            this.focusOnCard(this.current.depth, this.current.index + 1);
        }
    }

    up() {
        if (this.current.index > 0) {
            this.focusOnCard(this.current.depth, this.current.index - 1);
        }
    }

    // left jumps across to the cards parent, pending that there is one.
    left() {
        console.log("left");
        if (this.current.depth > 0) {
            let parentId = this.pillars[this.current.depth].nodes[this.current.index].parent!
            this.focusOnCard(this.current.depth - 1, this.cardIndexer[parentId].index)
        }
    }

    // right jumps across to the card's first child. If the card doesn't have a child, yet there exists
    // a pillar, then we jump instead to the last child of the next parent above 
    right() {
        console.log("right");
        if (this.current.depth < this.pillars.length - 1) {
            if (this.node.children.length > 0) {
                let index = this.cardIndexer[this.node.children[0]].index
                this.focusOnCard(this.current.depth + 1, index)
            } else {
                let index = -1
                for (let i = this.current.index - 1; i >= 0; i--) {
                    let length = this.pillar.nodes[i].children.length
                    if (length > 0) {
                        index = this.cardIndexer[this.pillar.nodes[i].children[length - 1]].index
                        break
                    }
                }
                if (index === -1) {
                    for (let i = this.current.index + 1; i < this.pillar.nodes.length; i++) {
                        let length = this.pillar.nodes[i].children.length
                        if (length > 0) {
                            index = this.cardIndexer[this.pillar.nodes[i].children[0]].index
                            break
                        }
                    }
                }
                this.focusOnCard(this.current.depth + 1, index)
            }
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
        this.node.focus()
    }

    blur(): void {
        if (this.node.editor.hasFocus()) {
            this.node.editor.blur()
        } else {
            this.node.blur()
        }
    }
}

export type WindowConfig = {
    margin: {
        pillar: number;
        family: number;
        card: number;
    };
    card: {
        width: {
            min: number;
            max: number;
        };
    };
};
