import { Card } from "../model/card";
import { CardPos } from "../model/model";
import { Size, Vector } from "../geometry";
import { Pillar } from "./pillar";
import { Family } from "./family";
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
            family: number;
        };
    } = {};

    cardWidth: number = 0;
    current: CardPos = { depth: 0, index: 0 };
    node: Node;
    
    private expandedFamily: Family | null = null;
    private active: boolean = false;

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
            family: {
                margin: config.margin.family,
                card: {
                    margin: config.margin.card,
                },
            },
            width: this.cardWidth,
            center: this.centerPoint.y
        };

        // add all the pillars
        for (let i = 0; i <= cards.length; i++) {
            let left = this.centerPoint.x - this.cardWidth / 2 + i * (this.cardWidth + this.config.margin.pillar);
            this.pillars.push(new Pillar(this.reference, left, pillarConfig));
        }

        // set up the root pillar
        this.pillars[0].appendFamily(cards[0]);
        this.pillars[0].nodes.forEach((node, index) => {
            node.el.onclick = () => {
                this.focusOnCardById(node.id)
            }
            this.cardIndexer[node.id] = {
                depth: 0,
                index: index,
                family: 0,
            }
        })

        // for the rest of the pillars, separate the cards into families
        // and fill the respective family with each card
        for (let depth = 0; depth < cards.length - 1; depth++) {
            let families = Family.separateCardsIntoFamilies(cards[depth + 1]);
            let familyIdx = 0;
            let cardIdx = 0;
            for (let index = 0; index < cards[depth].length; index++) {
                if (cards[depth][index].children.length > 0) {
                    // add a family of cards
                    let family = this.pillars[depth + 1].appendFamily(families[familyIdx])
                    familyIdx++;
                    family.nodes.forEach(node => {
                        node.el.onclick = () => {
                            this.focusOnCardById(node.id)
                        }
                        this.cardIndexer[node.id] = {
                            depth: depth + 1, 
                            index: cardIdx,
                            family: familyIdx
                        }
                        cardIdx++;
                    })
                } else {
                    // add an empty family
                    this.pillars[depth + 1].appendFamily()
                }
            }
        }

        // add empty families for each of the cards in the final pillar
        for (let index = 0; index < cards[cards.length -1].length; index++) {
            this.pillars[cards.length].appendFamily()
        }

        this.pillar = this.pillars[0];
        this.node = this.pillar.nodes[0];
        this.focusOnCard(this.current.depth, this.current.index);
    }

    focusOnCardById(id: string) {
        let pos = this.cardIndexer[id];
        this.focusOnCard(pos.depth, pos.index);
    }

    focusOnCard(depth: number, index: number): void {
        console.log("focus on card, depth: " + depth + ", index: " + index)

        // unlock on the previous card
        this.node.blur();
        this.node.dull();
        if (this.expandedFamily !== null) {
            this.expandedFamily.collapse()
        }

        // if the user has moved off the origin then reset the screen
        // back to the reference point
        this.resetReference();

        // if there has been a change in depth then move the pillars across
        if (depth !== this.current.depth) {
            let deltaX = (this.current.depth - depth) * (this.cardWidth + this.config.margin.pillar);
            this.pillars.forEach((pillar) => pillar.move(Vector.x(deltaX)));
        }

        // update and focus on the new card
        this.current.depth = depth;
        this.current.index = index;
        this.pillar = this.pillars[depth];
        this.node = this.pillar.nodes[index];
        this.node.spotlight();

        // shift the current pillar to vertically center on the locked card
        this.pillars[depth].centerCard(index);

        // shift the pillars to the left vertically so that the parent is
        // directly in line with the locked on card
        this.adjustAncestorPillars(depth, index);

        // shift all the pillars to the right vertically so that the
        // children of the current card are aligned.
        this.adjustOffspringPillars(depth, index);
    }

    private adjustAncestorPillars(depth: number, index: number) {
        for (let i = depth - 1; i >= 0; i--) {
            index = this.cardIndexer[this.pillars[i + 1].nodes[index].parent!].index;
            this.pillars[i].centerCard(index);
        }
    }

    private adjustOffspringPillars(depth: number, index: number) {
        if (this.pillars[depth].nodes[index].children.length === 0) {
            console.log("no children at depth " + depth)
            // expand the empty family to indicate that the card has no children
            this.pillars[depth+1].families[index].expand(this.pillars[depth].nodes[index].el.offsetHeight)
            this.expandedFamily = this.pillars[depth + 1].families[index]
            depth++
            // Check where the empty family of the card resides
            if (this.pillars[depth].isEmpty(index)) {
                // if it is below the last card in the pillar then center on the space below the
                // last card
                this.pillars[depth].centerEnd(this.pillars[depth - 1].nodes[index].el.offsetHeight)
            } else if (this.pillars[depth].isEmpty(0, index + 1)) {
                // if it is above the first card then center on the space above the first card
                this.pillars[depth].centerBegin(this.pillars[depth - 1].nodes[index].el.offsetHeight)
            } else {
                // if it is in between cards then center on the nearest card just above
                this.pillars[depth].centerCard(0, index)
            }
        }
        for (let i = depth + 1; i < this.pillars.length - 1; i++) {
            // center on the first child then iterate through the pillars.
            // NOTE: that we only iterate to the penultimate pillar because the last one is always empty
            index = this.findNearestChild(index, i - 1)
            this.pillars[i].centerCard(index)
        }
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
        this.node.editor.focus();
    }

    down() {
        if (this.current.index < this.pillar.nodes.length - 1) {
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
        if (this.current.depth > 0) {
            let parentId = this.pillars[this.current.depth].nodes[this.current.index].parent!;
            this.focusOnCard(this.current.depth - 1, this.cardIndexer[parentId].index);
        }
    }

    // right jumps across to the card's first child. If the card doesn't have a child, yet there exists
    // a pillar, then we jump instead to the last child of the next parent above
    right() {
        if (this.current.depth < this.pillars.length - 1) {
            this.focusOnCard(
                this.current.depth + 1, 
                this.findNearestChild(this.current.index)
            )
        }
    }

    private findNearestChild(index: number, depth?: number): number {
        if (!depth) depth = this.current.depth
        if (index >= this.pillars[depth].nodes.length) {
            index = this.pillars[depth].nodes.length - 1
        }
        if (index < 0) { index = 0 }
        if (this.pillars[depth].nodes[index].children.length > 0) {
            return this.cardIndexer[this.pillars[depth].nodes[index].children[0]].index
        }
        let resp = -1;
        for (let i = index - 1; i >= 0; i--) {
            let length = this.pillars[depth].nodes[i].children.length;
            if (length > 0) {
                resp = this.cardIndexer[this.pillars[depth].nodes[i].children[length - 1]].index;
                break;
            }
        }
        if (resp === -1) {
            for (let i = index + 1; i < this.pillar.nodes.length; i++) {
                let length = this.pillars[depth].nodes[i].children.length;
                if (length > 0) {
                    resp = this.cardIndexer[this.pillars[depth].nodes[i].children[0]].index;
                    break;
                }
            }
        }
        return resp
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
        // this.node.spotlight();
    }

    blur(): void {
        // this.node.dull();
    }

    key(key: string, shiftMode: boolean, ctrlMode: boolean): void {
        console.log(key)
        switch (key) {
            case "ArrowUp":
                this.up();
                break;
            case "ArrowDown":
                this.down();
                break;
            case "ArrowLeft":
                this.left();
                break;
            case "ArrowRight":
                this.right();
                break;
            case "Enter":
                this.node.focus();
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
