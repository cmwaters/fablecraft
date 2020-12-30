import { Card } from "../card";
import { Size, Vector, Geometry } from "../types";
import { Config } from "../config";
import { Story, Node } from "../story";
import { RedomComponent } from "redom";
import { ViewComponent } from "./view_component"

let g = Geometry;
const inverseScrollSpeed = 2;

export class Window implements RedomComponent, ViewComponent {
    // location: Vector; represents where the view is (not currently used)
    cards: Card[][] = [];
    margin: Size;
    element: HTMLElement;
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
    constructor(cards: Card[]) {
        this.element = element;
        console.log(this.element.style.width);
        this.cardWidth = this.calculateCardWidth();
        console.log(this.cardWidth);
        this.story = story;
        let cardX = (this.element.clientWidth - this.cardWidth) / 2;
        let cardY = 30;
        console.log("x: " + cardX);
        console.log("width: " + this.cardWidth);
        console.log("center: " + this.element.offsetWidth / 2 + " y: " + this.element.offsetHeight / 2);
        this.margin = Config.view.margin;

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

        let nodeIndex = 0
        for (let i = 0; i < this.story.depthSizes.length; i++) {
            let cardColumn: Card[] = [];
            for (let index = 0; index < this.story.depthSizes[i]; index++) {
                // console.log(cardY);
                let newCard = new Card(this, { x: cardX, y: cardY }, this.cardWidth, this.story.nodes[nodeIndex]);
                // console.log("pos: " + newCard.pos().y);
                newCard.deactivate();
                // console.log(newCard.height());
                cardY += newCard.height() + this.margin.height;
                cardColumn.push(newCard);
                nodeIndex++
            }
            this.cards.push(cardColumn);
            cardX += this.cardWidth + this.margin.width
        }
        

        element.onclick = (e: MouseEvent) => {
            this.handleClick(e);
        };

        console.log(this.cards[0].length);

        this.currentCard = this.cards[this.currentDepth][this.currentIndex];
        this.currentCard.activate();
        this.slideBottom(Config.card.toolbarHeight);
        this.center(this.currentDepth, this.currentIndex);
    }

    // keydown parses any input that is passed through to the view.
    keydown(key: string): void {
        console.log("key down: " + key);
        if (this.currentCard.quill.hasFocus()) {
            switch (key) {
                case "Escape":
                    this.currentCard.blur();
                    break;
                case "Backspace":
                    if (this.currentCard.quill.getText(0, 2) === "\n") {
                        this.deleteCardAndReorganize();
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (key) {
                case "Shift":
                    this.shiftMode = true;
                    break;
                case "ArrowDown":
                    if (this.shiftMode) {
                        this.createBelow();
                    } else {
                        this.down();
                    }
                    break;
                case "ArrowUp":
                    if (this.shiftMode) {
                        this.createAbove();
                    } else {
                        this.up();
                    }
                    break;
                case "ArrowLeft":
                    if (this.shiftMode) {
                        this.createParent();
                    } else {
                        this.left();
                    }
                    break;
                case "ArrowRight":
                    if (this.shiftMode) {
                        this.branch();
                    } else {
                        this.right();
                    }
                    break;
                case "Delete":
                case "Backspace":
                    this.deleteCardAndReorganize();
                    break;
                case "Enter":
                    setTimeout(() => {
                        let lastIdx = this.currentCard.quill.getLength() - 1;
                        this.currentCard.quill.setSelection(lastIdx, 0);
                        this.currentCard.focus();
                    }, 100);
                    break;
                default:
                    break; //nop
            }
        }
    }

    // most things are done on key down but for combinations that require holding a key we
    // use this key up to check when the operation is over
    keyup(key: string): void {
        switch (key) {
            case "Shift":
                this.shiftMode = false;
                break;
        }
    }

    // resize centers the object again (we may want to change the card width in the future)
    resize(): void {
        console.log("resizing");
        this.center(this.currentDepth, this.currentIndex);
    }

    // focus deactivates the previous card and activates a new card also centering it's position
    focus(depth: number, cardIdx: number): void {
        if (this.currentCard !== null) {
            this.currentCard.deactivate();
            this.slideBottom(-Config.card.toolbarHeight);
        }
        if (depth >= this.cards.length || depth < 0) {
            console.log("invalid depth: " + depth);
            return;
        }
        this.currentDepth = depth;
        if (cardIdx >= this.cards[depth].length || cardIdx < 0) {
            console.log("invalid card index " + cardIdx + " at depth " + depth);
            return;
        }
        this.currentIndex = cardIdx;
        this.currentCard = this.cards[this.currentDepth][this.currentIndex];
        this.currentCard.activate();
        this.slideBottom(Config.card.toolbarHeight);
        this.center(this.currentDepth, this.currentIndex);
        console.log(
            "focus on card at depth: " +
                depth +
                " and index: " +
                cardIdx +
                " with pos: " +
                g.string(this.currentCard.centerPos()) +
                " and height: " +
                this.currentCard.height() +
                " with " +
                this.currentCard.childrenCount +
                " children starting at " +
                this.currentCard.firstChildIdx
        );
        console.log(this.getState());
    }

    // center moves the view such that the target card is in the center of that view
    center(depth: number, cardIdx: number): void {
        if (this.movementInterval === null) {
            console.log("moving towards, x: " + this.element.offsetWidth / 2 + " y: " + this.element.offsetHeight / 2);
            this.movementInterval = setInterval(() => {
                let currentPos = this.cards[depth][cardIdx].centerPos(); //g.add(this.cards[depth][cardIdx].pos(), g.center({width: this.cardWidth, height: this.cards[depth][cardIdx].height()}))
                let diff = g.subtract(
                    { x: this.element.offsetWidth / 2, y: this.element.offsetHeight / 2 },
                    currentPos
                );

                // console.log("diff" + diff)
                if (Math.abs(diff.x) < 5 && Math.abs(diff.y) < 5) {
                    this.shift(diff);
                    console.log("final pos: " + g.string(this.cards[depth][cardIdx].centerPos()));
                    clearInterval(this.movementInterval);
                    this.movementInterval = null;
                } else {
                    this.shift(g.round(g.multiply(diff, 0.2)));
                }
            }, 30);
        } else {
            // we already have a previous movement job running so clear the existing one and then run this one
            clearInterval(this.movementInterval);
            this.movementInterval = null;
            this.center(depth, cardIdx);
        }
    }

    calculateCardWidth(): number {
        return Math.min(Math.max(0.5 * this.element.clientWidth, Config.card.width.min), Config.card.width.max);
    }

    up(): void {
        // if the current card is at the top then do nothing
        if (this.currentIndex === 0) {
            return;
        }
        // else activate the card above
        this.focus(this.currentDepth, this.currentIndex - 1);
    }

    down(): void {
        // if the current card is the last in the column then do nothing
        if (this.currentIndex === this.cards[this.currentDepth].length - 1) {
            return;
        }
        // else move to the card below and activate it
        this.focus(this.currentDepth, this.currentIndex + 1);
    }

    left(): void {
        console.log("go left");
        if (this.currentCard!.parentIdx !== null) {
            this.focus(this.currentDepth - 1, this.currentCard.parentIdx);
        }
    }

    right(): void {
        if (this.currentCard.firstChildIdx !== null) {
            this.focus(this.currentDepth + 1, this.currentCard.firstChildIdx + this.currentCard.childrenCount - 1);
        }
    }

    // createAbove creates a new card above the current once, repositioning surrounding cards, centering and activating the text
    // box of the current card. It also updates child/parent relations of other cards
    createAbove(): void {
        console.log("create above");
        let pIdx = this.currentCard.parentIdx;
        this.currentCard.deactivate();
        this.slideBottom(-Config.card.toolbarHeight);

        let newNode = new Node({ text: "", depth: this.currentDepth, index: this.currentIndex, parentIndex: pIdx });
        let newCard = new Card(this, g.copy(this.currentCard.pos()), this.calculateCardWidth(), newNode);
        this.cards[this.currentDepth].splice(this.currentIndex, 0, newCard);
        this.slideBottom(newCard.height() + this.margin.height + Config.card.toolbarHeight);
        if (pIdx !== null) {
            newCard.parentIdx = pIdx;
            // update the first child and child count parameters of the parent card
            if (this.currentIndex < this.cards[this.currentDepth - 1][pIdx].firstChildIdx) {
                this.cards[this.currentDepth - 1][pIdx].firstChildIdx = this.currentIndex;
            }
            this.cards[this.currentDepth - 1][pIdx].childrenCount++;
            this.changeChildrenIndices(1);
        }
        newCard.activate();
        newCard.focus();
        this.center(this.currentDepth, this.currentIndex);
        this.currentCard = newCard;
    }

    // createBelow creates a new card below the current one, repositioning surrounding cards, centering and activating the text box
    // of the current card. It also updates child/parent relations of other cards
    createBelow(): void {
        console.log("create below");
        let pIdx = this.currentCard.parentIdx;
        let newPos = g.add(this.currentCard.pos(), {
            x: 0,
            y: this.currentCard.height() + this.margin.height,
        });
        this.currentCard.deactivate();
        this.slideBottom(-Config.card.toolbarHeight);

        let newNode = new Node({ text: "", depth: this.currentDepth, index: this.currentIndex + 1, parentIndex: pIdx });
        let newCard = new Card(this, newPos, this.cardWidth, newNode);
        this.slideBottom(newCard.height() + this.margin.height + Config.card.toolbarHeight);
        this.currentIndex++;
        this.cards[this.currentDepth].splice(this.currentIndex, 0, newCard);
        // if the previous card had a parent we add this card as a new child of that same parent
        if (pIdx !== null) {
            newCard.parentIdx = pIdx;
            // increase the children count of the parent
            this.cards[this.currentDepth - 1][pIdx].childrenCount++;
            this.changeChildrenIndices(1);
        }
        newCard.activate();
        newCard.focus();
        this.center(this.currentDepth, this.currentIndex);
        this.currentCard = newCard;
    }

    // branch takes a current card and inserts a child card in the column across. It handles all family updates and is triggered directly through
    // a key down or button click.
    branch(): void {
        console.log("branch");
        let pIdx = this.currentIndex;
        if (this.currentCard.firstChildIdx === null) {
            // this card doesn't have any children yet
            console.log("branch 1");
            if (this.cards.length === this.currentDepth + 1) {
                console.log("branch 2");
                // this is the first new card of this depth
                let pos = g.add(this.currentCard.pos(), {
                    x: this.cardWidth + this.margin.width,
                    y: 0,
                });
                console.log("pos: " + pos.x);
                let newNode = new Node({ text: "", depth: this.currentDepth + 1, index: 0, parentIndex: pIdx });
                this.story.insert(newNode);
                this.cards.push([new Card(this, pos, this.cardWidth, newNode)]);
                this.currentCard.firstChildIdx = 0;
                this.currentCard.childrenCount++;
                this.focus(this.currentDepth + 1, 0);
                this.currentCard.parentIdx = pIdx;
                this.currentCard.focus();
                console.log("branch 5");
            } else {
                console.log("branch 3");
                // we have to find where to insert the card
                let idx = this.childInsertionIndex();
                let pos = g.add(this.currentCard.pos(), {
                    x: this.cardWidth + this.margin.width,
                    y: 0,
                });
                console.log("pos: " + pos.x);
                let newNode = new Node({ text: "", depth: this.currentDepth + 1, index: idx, parentIndex: pIdx });
                this.cards[this.currentDepth + 1].splice(idx, 0, new Card(this, pos, this.cardWidth, newNode));
                this.currentCard.firstChildIdx = idx;
                this.currentCard.childrenCount++;
                this.focus(this.currentDepth + 1, idx);
                this.currentCard.parentIdx = pIdx;
                this.currentCard.focus();
                // TODO: We will need to check if we are not colliding with the children cards from other parents either above us or below
            }
        } else {
            // this card already has children therefore append a new card at the bottom
            console.log("branch 4 " + this.currentCard.childrenCount);
            this.right();
            this.createBelow();
        }
    }

    // childInsertionIndex loops through to find out what index in the next column a child should be. This is used for new parents.
    private childInsertionIndex(): number {
        for (let idx = this.currentIndex - 1; idx >= 0; idx--) {
            if (this.cards[this.currentDepth][idx].firstChildIdx !== null) {
                return (
                    this.cards[this.currentDepth][idx].firstChildIdx + this.cards[this.currentDepth][idx].childrenCount
                );
            }
        }
        return 0;
    }

    // deletes the currently active card and reorganizes the remaining cards
    deleteCardAndReorganize(): void {
        console.log("deleting card at " + this.currentDepth + " and " + this.currentIndex);
        let height = this.currentCard.height();
        let pIdx = this.currentCard.parentIdx;

        // is this the last card in the entire story. In which case we can't delete it but
        // must clear it instead
        if (this.cards[this.currentDepth].length === 0 && this.currentDepth === 0) {
            this.currentCard.quill.setText("");
            return;
        }
        // delete all children first and then this card
        this.recursivelyDeleteChildren();
        this.deleteCard();

        // slide cards up to remove gap
        this.currentIndex--;
        this.slideBottom(-(height + this.margin.height));

        // If we are deleting the last card in this column. We must focus back to the parent
        if (this.cards[this.currentDepth].length === 0) {
            console.log("last card");
            if (pIdx === null) {
                alert("panic: current depth is not the root depth but the card has no parent index");
            }
            this.currentDepth--;
            this.currentIndex = pIdx;
            this.slideBottom(Config.card.toolbarHeight);
        } else if (this.currentIndex < 0) {
            /// unless we are at the top we always focus on the card above
            this.currentIndex = 0;
            this.cards[this.currentDepth][this.currentIndex].translate({
                x: 0,
                y: -Config.card.toolbarHeight,
            });
        }

        this.currentCard = this.cards[this.currentDepth][this.currentIndex];
        this.currentCard.activate();
        this.center(this.currentDepth, this.currentIndex);
    }

    // deleteCard simply deletes the current card. It does not move any other cards around
    private deleteCard(): void {
        let pIdx = this.currentCard.parentIdx;
        this.currentCard.remove();
        this.cards[this.currentDepth].splice(this.currentIndex, 1);
        if (pIdx !== null) {
            console.log(
                "decrementing child count at " + pIdx + " from " + this.cards[this.currentDepth - 1][pIdx].childrenCount
            );
            this.cards[this.currentDepth - 1][pIdx].childrenCount--;

            // check if we are deleting the last remaining child of the parent
            if (this.cards[this.currentDepth - 1][pIdx].childrenCount === 0) {
                this.cards[this.currentDepth - 1][pIdx].firstChildIdx = null;
            }

            this.changeChildrenIndices(-1);
        }
    }

    private recursivelyDeleteChildren(): void {
        if (this.currentCard.firstChildIdx !== null) {
            let returnPos = { depth: this.currentDepth, index: this.currentIndex };
            console.log(
                "deleting " +
                    this.currentCard.childrenCount +
                    " children starting at index: " +
                    this.currentCard.firstChildIdx
            );
            console.log(returnPos);
            this.currentDepth++;
            // loop though and delete all children
            while (this.cards[returnPos.depth][returnPos.index].firstChildIdx !== null) {
                this.currentIndex = this.cards[returnPos.depth][returnPos.index].firstChildIdx;
                this.currentCard = this.cards[this.currentDepth][this.currentIndex];
                this.deleteCardAndReorganize();
            }

            // restore the current position
            this.currentDepth = returnPos.depth;
            this.currentIndex = returnPos.index;
            this.slideBottom(-Config.card.toolbarHeight);
            console.log("restore depth " + this.currentDepth);
        }
    }

    // createParent makes a new parent card for the current active card - Injecting itself in the column to the left, or
    // making a new one if be. It takes over parentage.
    createParent() {
        console.log("Creating parent");
    }

    // handleClick runs the relevant logic when a click occurs inside the view. Mostly this involves passing it down
    // to the relevant card
    handleClick(e: MouseEvent): void {
        if (this.listeningToClick === false) {
            return;
        }
        console.log("x: " + e.clientX + " y: " + e.clientY);
        let clickPoint = { x: e.clientX, y: e.clientY };
        for (let depth = 0; depth < this.cards.length; depth++) {
            for (let idx = 0; idx < this.cards[depth].length; idx++) {
                let card = this.cards[depth][idx];
                let size = { width: this.cardWidth, height: card.height() };
                if (g.inside(card.pos(), size, clickPoint)) {
                    console.log(
                        "clicked on card " +
                            idx +
                            " card pos " +
                            g.string(card.pos()) +
                            " height " +
                            size.height +
                            " and click point " +
                            g.string(clickPoint)
                    );
                    if (!this.cards[depth][idx].quill.hasFocus()) {
                        this.focus(depth, idx);
                        this.currentCard.focus();
                    }
                    break;
                }
            }
        }
    }

    // pauseHandleClick gives a buffer in between click times to stop the user from accidentally clicking another button
    // whilst the view is moving. Is to be used only when the view is moving.
    private pauseHandleClick(): void {
        if (this.listeningToClick === false) {
            return;
        }
        this.listeningToClick = false;
        setTimeout(() => {
            this.listeningToClick = true;
        }, 200);
    }

    // changeChildrenIndices loops through all the parents below the current parent and shifts the first child indexes
    // by delta. A positive delta means there has been an insertion, a negative delta means there has been a deletion.
    //
    // TODO: potentially merge childrenCount increment here.
    changeChildrenIndices(delta: number) {
        let pIdx = this.currentCard.parentIdx;
        // this should never be the case that the parent index is not null but for our sanity
        if (pIdx !== null) {
            for (let idx = pIdx + 1; idx < this.cards[this.currentDepth - 1].length; idx++) {
                if (this.cards[this.currentDepth - 1][idx].firstChildIdx !== null) {
                    this.cards[this.currentDepth - 1][idx].firstChildIdx += delta;
                }
            }
        }
    }

    // shift shifts the entire view by a delta vector. This is primarily
    // used to traverse along the tree an focus on different cards.
    // does not change the current depth and index
    shift(delta: Vector): void {
        this.pauseHandleClick();
        for (let depth = 0; depth < this.cards.length; depth++) {
            for (let idx = 0; idx < this.cards[depth].length; idx++) {
                this.cards[depth][idx].translate(g.copy(delta));
            }
        }
    }

    // slides the rest of the cards in the current column by delta (used for inserting or deleting or changing heights)
    slideBottom(delta: number): void {
        console.log("slideBottom at " + this.currentDepth);
        this.pauseHandleClick();
        // if it is the last card then we have nothing to slide down
        if (this.currentIndex === this.cards[this.currentDepth].length - 1) {
            return;
        }
        for (let i = this.currentIndex + 1; i < this.cards[this.currentDepth].length; i++) {
            this.cards[this.currentDepth][i].translate({ x: 0, y: delta });
        }
    }

    slideTop(delta: number): void {}

    getState(): string {
        let str = "";
        for (let depth = 0; depth < this.cards.length; depth++) {
            for (let idx = 0; idx < this.cards[depth].length; idx++) {
                str += "\n";
                str += "cards at depth: " + depth + " and index: " + idx + "\n";
                str += this.cards[depth][idx].string();
            }
        }
        return str;
    }
}
