import { Node } from './node'
import { Pos } from "./pos"
import { Vector } from "./geometry";
import { Branch } from "./branch"
import { Pillar } from "./pillar";
import { Family } from "./family";
import { RedomComponent, el, mount, unmount } from "redom";
import { Card } from "./card";
import { Config, PillarConfig, Options } from './config';
import { Events } from './events';
import sort from 'fast-sort'
import { errors } from './errors';
import Delta from "quill-delta"
import "../assets/tree.css"

export class Tree implements RedomComponent {

    // ###################################### PUBLIC VARIABLES ###########################################

    el: HTMLElement;
    event: Events;

    // ###################################### PRIVATE VARIABLES ###########################################

    private pillars: Pillar[] = [];
    private pillar: Pillar; // the current pillar
    private pillarConfig: PillarConfig
    private reference: HTMLElement;
    private centerPoint: Vector = new Vector();
    private config: Config;

    // we use an indexer to track the position of cards based on their id
    private cardIndexer: Pos[] = [];

    private cardWidth: number = 0;
    private current: Pos = new Pos()
    private card: Card;
    private expandedFamily: Family | null = null;

    private moveable: boolean = true;
    private interactive: boolean = true;

    // key modes
    private ctrlMode: boolean = false;
    private commandReady: boolean = false;
    private shiftMode: boolean = false
    private altMode: boolean = false

    // constructor for initiating the tree
    constructor(element: HTMLElement, config: Config, nodes?: Node[], options?: Options) {
        this.config = config;
        this.el = element

        // we add a reference element inside the given element. This allow for easier navigation
        // as the user movements move the entire reference frame as opposed to all the individual
        // elements inside
        this.reference = el("div#reference");
        mount(this.el, this.reference);

        // calculate what the optimal width for each card should be
        this.calculateCardWidth();

        // calculate the center point of the element
        this.calculateCenterPoint()

        // now we can form the configuration of the pillar
        this.pillarConfig = this.setPillarConfig()

        // create the first pillar and family
        this.appendPillar()
        this.pillars[0].appendFamily()

        if (nodes && nodes.length > 0) {
            console.log("adding existing nodes")
            console.log(nodes)

            sort(nodes).asc("uid")

            let currentNodes: Node[] = [] 

            // we take the order of the nodes to be their respective id's
            nodes.forEach(node => {
                if (node.uid !== this.cardIndexer.length) {
                    throw new Error("non-montonically increasing node uid got " + node.uid + ", expected " + this.cardIndexer.length)
                }
                this.cardIndexer.push(node.pos)
                if (node.pos.isNotNull()) {
                    currentNodes.push(node)
                }
            })

            // now sort the nodes so we can easily build the tree
            sort(currentNodes).asc([
                n => n.pos.depth, 
                n => n.pos.family,
                n => n.pos.index
            ])

            if (currentNodes[0].pos.depth !== 0) {
                throw new Error("there must be at least one node with depth 0")
            }

            currentNodes.forEach(node => this.appendNode(node))
        } else {
            let firstNode: Node = {
                uid: 0,
                pos: new Pos(),
                content: new Delta(),
            }
            this.appendNode(firstNode)
            this.cardIndexer.push(firstNode.pos)
        }

        window.onresize = (ev: UIEvent) => {
            console.log(ev)
            this.resize()
        }

        window.onmousewheel = (ev: Event) => {
            let e = ev as WheelEvent
            if (this.moveable) {
                if (this.shiftMode) {
                    this.pan(new Vector(-e.deltaY, -e.deltaX).divide(this.config.inverseScrollSpeed))
                } else {
                    this.pan(new Vector(-e.deltaX, -e.deltaY).divide(this.config.inverseScrollSpeed))
                }
            }
        }

        document.onkeydown = (e: KeyboardEvent) => {
            if (this.interactive) {
                this.handleKeyDown(e)
            }
        }

        document.onkeyup = (e: KeyboardEvent) => {
            if (this.interactive) {
                this.handleKeyUp(e)
            }
        }

        // set event as a nop
        if (options && options.events) {
            this.event = options.events
        } else {
            this.event = {}
        }

        // begin by focusing on the first card
        this.pillar = this.pillars[0]
        this.card = this.pillars[0].families[0].cards[0]
        this.selectNode(this.current, true);
    }

    // ###################################### PUBLIC METHODS ###########################################

    // selectNode selects a new node to focus on, closing and blurring the previously selected node and
    // centering on the new node, highlighting the node, it's family memebers, children and parent. If focus
    // is set to true then the text editor wil also be enabled.
    selectNode(pos: Pos, focus: boolean = false): void {
        console.log("focus on node, depth: " + pos.depth + ", family: " + pos.family + ", index: " + pos.index)
        let err = this.validatePos(pos)
        if (err) {
            throw err
        }

        // unlock on the previous card
        let lastPos = this.card.pos()
        if (lastPos.isNotNull()) {
            if (lastPos.depth > 0) {
                // if there is a parent, make it full
                let prevParent = this.getParentPos(lastPos)
                this.pillars[prevParent.depth].families[prevParent.family].cards[prevParent.index].dull()
            }
            // deactivate and dull the previously focused card
            this.card.blur();

            // dull out the previous family
            this.pillar.families[lastPos.family].dull()
            if (lastPos.depth < this.pillars.length - 1) {
                let childrenIndex = this.pillars[lastPos.depth].countCards(lastPos.family) + lastPos.index
                this.pillars[lastPos.depth + 1].families[childrenIndex].dull()
            }

            if (this.expandedFamily !== null) {
                this.expandedFamily.collapse()
            }
        }

        // if the user has moved off the origin then reset the screen
        // back to the reference point
        this.resetReference();

        // if there has been a change in depth then move the pillars across
        if (pos.depth !== this.current.depth) {
            let deltaX = (this.current.depth - pos.depth) * (this.cardWidth + this.config.margin.pillar);
            this.pillars.forEach((pillar) => pillar.shift(Vector.x(deltaX), this.config.transitionTime));
        }

        // update and focus on the new card
        this.current = pos
        this.pillar = this.pillars[pos.depth];
        this.card = this.pillar.families[pos.family].cards[pos.index];
        // hightlight family
        this.pillar.families[pos.family].highlight()
        // focus on the card (i.e. activate the text box)
        this.card.spotlight();
        // highlight parent
        if (pos.depth > 0) {
            let parentPos = this.getParentPos(pos)
            this.pillars[parentPos.depth].families[parentPos.family].cards[parentPos.index].highlight()
        }
        // highlight the children
        if (pos.depth < this.pillars.length - 1) {
            let childrenIndex = this.pillars[pos.depth].countCards(pos.family) + pos.index
            this.pillars[pos.depth + 1].families[childrenIndex].highlight()

        }

        // shift the current pillar to vertically center on the locked card
        this.pillars[pos.depth].centerCard(pos.family, pos.index);
        if (focus) {
            // add the event listeners. NOTE: we add the listeners dynamically every time. This allows nodes
            // to be adaptive when an event listener is modified
            this.card.onModify = (delta: Delta) => {
                if (this.event.onModifyNode) {
                    this.event.onModifyNode(this.card.id(), delta)
                }
            }
            this.card.onMove = (pos: Pos, oldPos: Pos) => {
                if (this.event.onMoveNode) {
                    this.event.onMoveNode(this.card.id(), oldPos, pos)
                }
            }
            // focus on the car 
            this.card.focus()
        }

        // adjust the position of the card so that it is always in the center even
        // when the user is typing
        // TODO: perhaps this is something we can optimize
        this.card.editor.on("text-change", () => {
            this.pillar.centerCard(this.current.family, this.current.index)
        })

        // shift the pillars to the left vertically so that the parent is
        // directly in line with the locked on card
        this.adjustAncestorPillars(pos);

        // shift all the pillars to the right vertically so that the
        // children of the current card are aligned.
        this.adjustOffspringPillars(pos);
    }

    // inserts a node into the tree. Throws an error if the node
    // has an invalid position. Moves cards in the same family that are
    // below by one index down. Will not cause the matching insertNode
    // event to fire
    insertNode(pos: Pos, focus: boolean = false, content: string | Delta = ""): Node {
        // if a string we convert it to a delta as a single insert operation 
        if (typeof content === "string") {
            content = new Delta().insert(content)
        }

        let node = {
            uid: this.cardIndexer.length,
            pos: pos,
            content: content
        }

        this.validateNewNode(node) 

        // insert the card into the correct family
        this.pillars[node.pos.depth].families[node.pos.family].insertCard(node)

        // check if we are making an addition to the last pillar
        if (node.pos.depth === this.pillars.length - 1) {
            this.appendPillar()
        }

        // a new card always corresponds with the creating of a new empty family
        let familyIndex = this.pillars[pos.depth].countCards(pos.family) + pos.index
        this.pillars[node.pos.depth + 1].insertFamily(familyIndex)

        // finally we add the node to the cardIndexer
        this.cardIndexer.push(node.pos)

        if (focus) {
            this.selectNode(pos, true)
        }

        return node
    }

    // moves a node from one position to another. Throws an error if any of the
    // positions are invalid. Updates the respective families. Does not trigger any events.
    // moveNode essentially works by inserting it an exact copy in the new position and then
    // deleting the node at the old position
    moveNode(from: Pos, to: Pos, focus: boolean = false): void {
        // validate that the "from" position exists on the tree
        let err = this.validatePos(from)
        if (err) {
            throw err
        }

        // if to and from are the same position we return early
        if (from.equals(to)) { return }

        // create a copy of the node and it's entire branch
        let branch = this.getBranch(from)

        // validate the position of to by making it a new node. Remember we can also move a node
        // to a place where it is appended to the end of a family (i.e. not a current valid position)
        let fromNode = this.nodeAt(from).node()
        let toNode = {
            uid: fromNode.uid,
            pos: to.copy(),
            content: fromNode.content,
        }

        // validate the the position where the node shall be moved to (we treat it as if adding a new node)
        this.validateNewNode(toNode)

        // there is one exception to the above validation which is when we are trying to move a node
        // to the next vacant position in the same family. Check this case
        if (to.depth === from.depth && 
            to.family === from.family && 
            to.index === this.pillars[to.depth].families[to.family].cards.length) {
                throw new Error(errors.indexOutOfBounds)
            }

        // okay the new position is valid
        // delete the node and subsequent children where the node used to be
        this.deleteNode(from)

        // change the branch to have the position of where it should be
        this.updateBranchPos(branch, to)

        // now finally insert the same node into the new position
        // this will also update the card indexer
        this.insertBranch(branch)

        // if the user requested to focus on the new node then we do that now
        if (focus) {
            this.selectNode(to, true)
        }
    }

    // deletes the card and recursively deletes all the offspring of that card
    // also removes the card from the indexer. Does not trigger any events.
    deleteNode(pos: Pos): void {
        console.log("deleting node at " + pos.string())
        // first validate the position
        let err = this.validatePos(pos)
        if (err) {
            throw err
        }

        // we need to make sure that we always have at least one card remaining
        if (pos.depth !== 0 || this.pillars[0].families[0].cards.length !== 1) {

            // remove the card
            let id = this.pillars[pos.depth].families[pos.family].deleteCard(pos.index)

            // update the card indexer
            this.cardIndexer[id] = Pos.null()

            // if it is the last card in the penultimate pillar then clear the card and remove
            // the last pillar. Remember that the last pillar is always a ghost pillar (only
            // contains empty families)
            if (pos.depth === this.pillars.length - 2 && this.pillars[pos.depth].countCards() === 0) {
                let lastPillar = this.pillars.pop()
                unmount(this.reference, lastPillar!)

                // find the next node to select
                let { family, index } = this.pillars[pos.depth - 1].getFamilyAndIndex(pos.family)
                this.selectNode(new Pos(pos.depth - 1, family, index))
                return
            }

            // recursively delete all the families of that node
            let childrenIndex = this.getChildrenIndex(pos)
            this.deleteFamily(pos.depth + 1, childrenIndex)

            // focus on the next card first by looking for the next card above and failing that,
            // looking for the next card below
            let nextPos = pos.above(this.pillars[pos.depth])
            if (nextPos.isNotNull()) {
                return this.selectNode(nextPos)
            }

            pos.decrement()

            nextPos = pos.below(this.pillars[pos.depth])
            if (nextPos.isNotNull()) {
                return this.selectNode(nextPos)
            }

            throw new Error("deleting node but there is no node above or below to select")

        } else {
            // we clear the text of the last remaining editor
            this.pillars[0].families[0].cards[0].editor.setText("")
        }
    }

    // modifyNode alters the text of the node at position pos in the tree
    // NOTE: this does not trigger an event
    modifyNode(pos: Pos, delta: Delta): void {
        // first validate the position
        let err = this.validatePos(pos)
        if (err) {
            throw err
        }

        // now modify the text
        this.pillars[pos.depth].families[pos.family].cards[pos.index].modify(delta)
    }

    // getCard retrieves a reference of the card at the position pos in the tree. 
    // If none is provided then it returns the card it is centered on. 
    getCard(pos: Pos = this.current): Card {
        let err = this.validatePos(pos)
        if (err !== null) {
            throw err
        }
        return this.nodeAt(pos)
    }

    // focus on this particular window, activating key and other input listeners
    focus(): void {
        this.interactive = true;
        this.moveable = true;
    }

    // blur switches off this particlar window meaning that the end user can not interact with anything. the
    // window also becomes frozen unless moveable is set to true
    blur(moveable: boolean = false): void {
        this.interactive = false
        this.moveable = moveable;
        if (this.card.hasFocus()) {
            this.card.blur()
        }
    }

    // string returns the structure of the tree as a multi-line indexed string. Good for debugging
    string(withText: boolean = false): string {
        let result = "Tree\n"
        this.pillars.forEach((pillar, depth) => {
            result += "\tPillar " + depth + "\n"
            pillar.families.forEach((fam, family) => {
                result += "\t\tFamily " + family + "\n"
                fam.cards.forEach((card, index) => {
                    result += "\t\t\tCard " + index + " (id:" + card.id() + ")"
                    if (card.hasFocus()) {
                        result += " - Active\n"
                    } else if (card.pos().equals(this.current)) {
                        result += " - Selected\n"
                    } else {
                        result += "\n"
                    }

                    if (withText) {
                        result += "\t\t\t" + card.editor.getText()
                    }
                })
            })
        })
        return result
    }

    // ###################################### PRIVATE METHODS ###########################################

    // appendNode appends a node to it's respective family. This only works when nodes are in order.
    // This is used at the start. NOTE: this does not update the card indexer.
    private appendNode(node: Node): void {
        this.validateNewNode(node)

        this.pillars[node.pos.depth].families[node.pos.family].appendCard(node)

        if (node.pos.depth === this.pillars.length - 1) {
            this.appendPillar()
        }

        this.pillars[node.pos.depth + 1].appendFamily()
    }

    // appendPillar adds a new empty pillar to the tree
    private appendPillar() {
        let origin = this.centerPoint.x - this.cardWidth / 2 + (this.pillars.length * (this.cardWidth + this.config.margin.pillar))
        this.pillars.push(new Pillar(this.reference, origin, this.pillarConfig))
    }

    

    // recurses through pillars, deleting all families originating from the same family
    private deleteFamily(depth: number, family: number) {
        console.log("delete family " + family + " at " + depth)

        // if this is an empty family then delete it and do not proceed any further
        // this is also the termination condition of the recursion
        if (this.pillars[depth].families[family].cards.length === 0) {
            this.pillars[depth].deleteFamily(family)
            return
        }

        // find the index of the first and last node of the family
        let start = this.getChildrenIndex(new Pos(depth, family, 0))
        let end = start + this.pillars[depth].families[family].cards.length


        // recursively delete all families of the children
        for (let i = start; i < end; i++) {
            this.deleteFamily(depth + 1, i)
        }

        // delete family
        let deletedIds = this.pillars[depth].deleteFamily(family)
        for (let id of deletedIds) {
            this.cardIndexer[id] = Pos.null()
        }

        // check if this was the last family. If so we can delete the pillar. 
        // Note that given the nature of the assertion we can assume that this is
        // always the last pillar in the list
        if (this.pillars[depth].families.length === 0) {
            if (depth !== this.pillars.length - 2) {
                throw new Error("deletion error: expected pillar to be the final pillar")
            }
            this.pillars.pop()
        }
    }

    private getParentPos(pos: Pos): Pos {
        if (pos.depth === 0) {
            throw new Error("card has no parent")
        }

        let { family, index } = this.pillars[pos.depth - 1].getFamilyAndIndex(pos.family)
        return new Pos(pos.depth -1, family, index)
    }

    private resetReference() {
        this.reference.style.left = "0px";
        this.reference.style.top = "0px";
    }

    private calculateCardWidth() {
        this.cardWidth = Math.min(Math.max(0.5 * this.el.clientWidth, this.config.card.width.min), this.config.card.width.max);
    }

    private calculateCenterPoint() {
        this.centerPoint = Vector.centerOfElement(this.el)
        console.log(this.centerPoint.string())
    }

    // pan moves the view of the window. It does not displace any of the cards individually rather
    // moves everything uniformly
    private pan(delta: Vector): void {
        if (this.moveable) {
            this.reference.style.left = this.reference.offsetLeft + delta.x + "px";
            this.reference.style.top = this.reference.offsetTop + delta.y + "px";
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        switch (e.key) {
            case "Meta":
            case "Control":
                if (this.commandReady && this.card.hasFocus()) {
                    this.card.showCommandLine()
                } 
                this.commandReady = false;
                this.ctrlMode = false;
                break
            case "Alt":
                this.altMode = false;
                break;
            case "Shift":
                this.shiftMode = false;
                break;
        }
    }

    private handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case "Meta":
            case "Control":
                this.commandReady = true;
                this.ctrlMode = true;
                break;
            case "Alt":
                this.altMode = true;
                break;
            case "Shift":
                this.shiftMode = true;
                break;
            default:
                this.key(e.key)
                this.commandReady = false;
                break;
        }
    }

    // key takes the current key pressed and executes the appropriate function
    // on the window. In the future, key bindings could be made more dynamic
    private key(key: string): void {
        // if the tree is disabled then ignore
        if (!this.interactive) {
            return
        }
        console.log(key)
        if (this.card.hasFocus()) {
            switch (key) {
                case "ArrowUp":
                    if (this.card.atStart()) {
                        if (this.shiftMode) {
                            this.createAbove()
                            if (this.event.onNewNode)
                                this.event.onNewNode(this.card.id(), this.current.copy())
                        } else if (this.altMode) {
                            this.shiftUpwards()
                        } else {
                            this.up()
                            this.card.focus("end")
                            if (this.event.onSelectNode)
                                this.event.onSelectNode(this.card.node())
                        }
                    }
                    break;
                case "ArrowDown":
                    if (this.card.atEnd()) {
                        if (this.shiftMode) {
                            this.createBelow()
                            if (this.event.onNewNode)
                                this.event.onNewNode(this.card.id(), this.current.copy())
                        } else if (this.altMode) {
                            this.shiftDownwards()
                        } else {
                            this.down()
                            this.card.focus("start")
                            if (this.event.onSelectNode) 
                                this.event.onSelectNode(this.card.node())
                        }
                    }
                    break;
                case "ArrowRight":
                    if (this.card.atEnd()) {
                        if (this.shiftMode) {
                            this.createChild()
                            if (this.event.onNewNode)
                                this.event.onNewNode(this.card.id(), this.current.copy())
                        } else {
                            this.down()
                            this.card.focus("start")
                            if (this.event.onSelectNode)
                                this.event.onSelectNode(this.card.node())
                        }
                    }
                    break;
                case "ArrowLeft":
                    if (this.card.atStart()) {
                        this.left()
                        this.card.focus("start")
                        if (this.event.onSelectNode)
                            this.event.onSelectNode(this.card.node())
                    }
                    break;
                case "Backspace":
                    if (this.card.backspace()) {
                        let node = this.getCard().node()
                        this.deleteNode(this.current)
                        if (this.event.onDeleteNode)
                            this.event.onDeleteNode(node)
                    }
                    break;
                case "Escape":
                    this.card.escape()
                    break;
            }
            return
        }
        switch (key) {
            case "ArrowUp":
                if (this.shiftMode) {
                    this.createAbove()
                    if (this.event.onNewNode)
                        this.event.onNewNode(this.card.id(), this.current.copy())
                } else if (this.altMode) {
                    this.shiftUpwards()
                } else {
                    this.up();
                    if (this.event.onSelectNode)
                        this.event.onSelectNode(this.card.node())
                }
                break;
            case "ArrowDown":
                if (this.shiftMode) {
                    this.createBelow()
                    if (this.event.onNewNode)
                        this.event.onNewNode(this.card.id(), this.current.copy())
                } else if (this.altMode) {
                    this.shiftDownwards()
                } else {
                    this.down();
                    if (this.event.onSelectNode)
                        this.event.onSelectNode(this.card.node())
                }
                break;
            case "ArrowLeft":
                if (this.shiftMode) {
                    this.createParent()
                    if (this.event.onNewNode)
                        this.event.onNewNode(this.card.id(), this.current.copy())
                } else {
                    this.left();
                    if (this.event.onSelectNode)
                        this.event.onSelectNode(this.card.node())
                }
                break;
            case "ArrowRight":
                if (this.shiftMode) {
                    this.createChild()
                    if (this.event.onNewNode)
                        this.event.onNewNode(this.card.id(), this.current.copy())
                } else {
                    this.right();
                    if (this.event.onSelectNode)
                        this.event.onSelectNode(this.card.node())
                }
                break;
            case "Enter":
                this.card.focus();
                break;
            case "Backspace":
                let node = this.getCard().node()
                this.deleteNode(this.current)
                if (this.event.onDeleteNode)
                    this.event.onDeleteNode(node)
                break;
        }

    }

    private down() {
        let pos = this.current.below(this.pillar)
        if (pos.isNotNull()) {
            this.selectNode(pos)
        }
    }

    private up() {
        let pos = this.current.above(this.pillar)
        if (pos.isNotNull()) {
            this.selectNode(pos)
        }
    }

    // left jumps across to the cards parent, pending that there is one.
    private left() {
        if (this.current.depth > 0) {
            let parentPos = this.getParentPos(this.current)
            this.selectNode(parentPos);
        }
    }

    // right jumps across to the card's first child. If the card doesn't have a child, yet there exists
    // a pillar, then we jump instead to the last child of the next parent above
    private right() {
        let family = this.getChildrenIndex(this.current)
        if (this.current.depth < this.pillars.length - 1) {
            if (!this.pillars[this.current.depth + 1].families[family].isEmpty()) {
                this.selectNode(new Pos(this.current.depth + 1, family, 0))
            }
        }
    }

    private createAbove(pos: Pos = this.current) {
        this.insertNode(pos.copy(), true)
    }

    private createBelow(pos: Pos = this.current) { 
        this.insertNode(pos.copy().increment(), true)
    }

    private createChild(pos: Pos = this.current) {
        let family = this.getChildrenIndex(pos)
        let index = this.pillars[pos.depth + 1].families[family].cards.length 
        let newPos = new Pos(pos.depth + 1, family, index)
        this.insertNode(newPos, true)
    }

    private recenterCard(): void {
        console.log("recentering")
        this.pillar.centerCard(this.current.family, this.current.index)
    }

    private createParent() {
        console.log("create parent")
    }

    private shiftUpwards(pos: Pos = this.current) {
        console.log("shiftUpwards")

        let newPos = pos.above(this.pillars[pos.depth])
        if (newPos.isNotNull()) {
            this.moveNode(pos, newPos, true)
            if (this.event.onMoveNode)
                this.event.onMoveNode(this.card.id(), pos, newPos)
        }
    }

    private shiftDownwards(pos: Pos = this.current) {
        console.log("shiftDownwards")

        let newPos = pos.below(this.pillars[pos.depth])
        if (newPos) {
            this.moveNode(pos, newPos, true)
            if (this.event.onMoveNode)
                this.event.onMoveNode(this.card.id(), pos, newPos)
        }
    }

    private getChildrenIndex(pos: Pos): number {
        return this.pillars[pos.depth + 1].countCards(pos.family) + pos.index
    }

    // resize centers the object and adjusts the card width dependent on the new window width
    //
    // TODO: Come up with a more intelligent resizing system. We should find out how many columns we
    // can fit in the window 1/2/3 and then use that to calculate the width and positioning of each
    // pillar so that it all fits nicely
    private resize(): void {
        console.log("resizing window")

        // calculate the new center and the center delta
        let oldCenterPoint = this.centerPoint.copy()
        this.calculateCenterPoint()
        let delta = this.centerPoint.subtract(oldCenterPoint).multiply(2)
        // check if there has been a change in the size of the element
        if (delta.isZero()) {
            return
        }

        // calculate the new width and the width delta
        let widthDelta = this.cardWidth
        this.calculateCardWidth()
        widthDelta -= this.cardWidth

        // adjust the position and size of the focused pillar
        this.pillar.changeWidth(this.cardWidth)
        this.pillar.shift(new Vector((delta.x + widthDelta)/2, delta.y/2))
        
        // adjust the position and size of the pillars to the right
        for (let i = this.current.depth + 1; i < this.pillars.length; i++) {
            this.pillars[i].changeWidth(this.cardWidth)
            console.log("width delta " + widthDelta)
            let margin = new Vector(delta.x/2 - widthDelta/2 - ((i - this.current.depth - 1) * widthDelta), delta.y/2)
            console.log("margin: " + margin.string())
            this.pillars[i].shift(margin)
        }

        // adjust the position and size of the pillars to the left
        for (let i = this.current.depth - 1; i >= 0; i--) {
            this.pillars[i].changeWidth(this.cardWidth)
            let margin = new Vector(delta.x/2 + 1.5 * widthDelta, delta.y/2)
            this.pillars[i].shift(margin)
        }
    }

    private changeLayout(layout: string) {

    }

    private selectNodeById(id: number) {
        if (id >= this.cardIndexer.length || id < 0) {
            console.error("focus on invalid index. Expected non negative number less than " + this.cardIndexer.length + " but got " + id)
        }
        let pos = this.cardIndexer[id]
        if (pos) {
            this.selectNode(pos);
        }
    }

    private validatePos(pos: Pos): Error | null {
        if (!pos) {
            return new Error("pos is null")
        }

        if (!pos.valid()) {
            return new Error(errors.invalidPos)
        }

        if (pos.depth >= this.pillars.length - 1) {
            return new Error("pos.depth exceeds maximum tree depth " + (this.pillars.length - 1))
        }

        if (pos.family >= this.pillars[pos.depth].families.length) {
            return new Error("pos.family exceeds family count " + this.pillars[pos.depth].families.length + 
            " within tree pillar.")
        }

        if (pos.index >= this.pillars[pos.depth].families[pos.family].cards.length) {
            return new Error("pos.index exceeds the amount of cards in the family " +
                (this.pillars[pos.depth].families[pos.family].cards.length - 1))
        }

        return null
    }

    private validateNewNode(node: Node): void {
        if (!node.pos.valid()) {
            throw new Error(errors.invalidPos)
        }

        if (node.pos.depth >= this.pillars.length) {
            throw new Error(errors.depthExceededf(node.pos.depth, this.pillars.length - 1))
        }

        if (node.pos.depth === 0 && node.pos.family !== 0) {
            throw new Error(errors.oneRootFamily)
        }

        if (node.pos.family >= this.pillars[node.pos.depth].families.length) {
            throw new Error(errors.orphanNodef(node.pos.family, this.pillars[node.pos.depth].families.length - 1))
        }
    }

    private setPillarConfig(): PillarConfig {
        return { 
            family: {
                margin: this.config.margin.family,
                card: {
                    margin: this.config.margin.card,
                    updateFrequency: this.config.card.updateFrequency
                }
            },
            width: this.cardWidth,
            centerY: this.centerPoint.y,
            transitionTime: this.config.transitionTime,
            frameRate: this.config.frameRate
        }
    }

    private adjustAncestorPillars(pos: Pos) {
        // make a copy of the pos so we can mutate it
        let p = pos.copy();

        // iterate through the trace of parents back to the root pillar
        while (p.depth > 0) {
            p = this.getParentPos(p)
            this.pillars[p.depth].centerCard(p.family, p.index);
        }
    }

    private nodeHasChildren(pos: Pos): boolean {
        let childrenIndex = this.getChildrenIndex(pos)
        return !this.pillars[pos.depth + 1].families[childrenIndex].isEmpty()
    }

    private adjustOffspringPillars(pos: Pos) {
        // make a copy of the pos so we can mutate it
        let p = pos.copy()

        // check if the node has no children
        while (p.depth < this.pillars.length - 2) {
            if (p.depth < this.pillars.length - 1 && !this.nodeHasChildren(p)) {
                // expand the empty family to indicate that the card has no children
                let family = this.getChildrenIndex(p)
                let parentHeight = this.nodeAt(p).el.offsetHeight
                this.expandFamily(p.depth + 1, family, parentHeight)
                p.depth++

                // Check where the empty family of the card resides
                // if it is below the last card in the pillar then center on the space below the
                // last card
                if (this.pillars[p.depth].isEmpty(family)) {
                    this.pillars[p.depth].centerEnd(parentHeight)
                } else if (this.pillars[p.depth].isEmpty(0, family + 1)) {
                    // if it is above the first card then center on the space above the first card
                    this.pillars[p.depth].centerBegin(parentHeight)
                } else {
                    // if it is in between cards then center on the nearest card just above
                    this.pillars[p.depth].centerFamily(family)
                }
            } else {
                let childrenIndex = this.getChildrenIndex(pos)
                console.log("centering card at depth " + (p.depth + 1) + ", family: " + childrenIndex + ", index: 0")
                this.pillars[p.depth + 1].centerCard(childrenIndex, 0)
                p = new Pos(p.depth + 1, childrenIndex, 0)
            }
        }
    }

    private nodeAt(pos: Pos): Card {
        return this.pillars[pos.depth].families[pos.family].cards[pos.index]
    }

    private expandFamily(depth: number, family: number, height: number): void {
        this.pillars[depth].families[family].expand(height)
        this.expandedFamily = this.pillars[depth].families[family]
    }

    private getBranch(pos: Pos): Branch {
        let card = this.nodeAt(pos) 
        let childrenIndex = this.getChildrenIndex(pos)
        let children: Branch[] = []
        if (pos.depth < this.pillars.length - 1) {
            for (let index = 0; index < this.pillars[pos.depth + 1].families[childrenIndex].cards.length; index++) {
                let childPos = new Pos(pos.depth + 1, childrenIndex, index)
                children.push(this.getBranch(childPos))
            }
        }
        return {card, children}
    }

    // updates the branches position. This assumes the position is correct
    private updateBranchPos(branch: Branch, pos: Pos): void {
        console.log("settng node pos to " + pos.string())
        branch.card.setPos(pos)
        if (pos.depth >= this.pillars.length - 1) {
            return
        }
        let familyIndex = this.getChildrenIndex(pos.copy().shift({ depth: -1 }))
        branch.children.forEach(b => {
            let newPos = new Pos(pos.depth + 1, familyIndex, b.card.pos().index)
            this.updateBranchPos(b, newPos)
        })
    }

    // inserts an entire branch into the tree. This assumes that the branches position is valid
    private insertBranch(branch: Branch): void {
        let node = branch.card.node()
        console.log("inserting branch based on node, " + node.pos.string() )

        // insert the card into the correct family
        this.pillars[node.pos.depth].families[node.pos.family].insertCard(node)

        // check if we are making an addition to the last pillar
        if (node.pos.depth === this.pillars.length - 1) {
            this.appendPillar()
        }

        // a new card always corresponds with the creating of a new empty family
        this.pillars[node.pos.depth + 1].insertFamily(node.pos.index)

        branch.children.forEach(b => {
            this.insertBranch(b)
        })        
    }
}

