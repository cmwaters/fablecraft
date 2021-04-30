import chai, { assert } from 'chai'
import { Tree } from "../../tree/tree"
import { Node } from "../../tree/node"
import { defaultConfig } from "../../tree/config"
import { Pos } from "../../tree/pos"
import {
    TreeTypology,
    assertTypology,
    getNodeAsElement,
} from "./helper"
let expect = chai.expect
import Delta from "quill-delta"
import { errors } from "../../tree/errors"

let container: HTMLElement
let keySpeed = 150 // 150 milliseconds per action



describe.only("Fable Tree | Input", () => {
    let eventRecorder: EventRecorder

    before(() => {
        let div = document.getElementById("test-container")
        expect(div).to.not.be.null
        container = div!
        container.innerHTML = ""
        eventRecorder = resetEventRecorder()
    })

    afterEach(() => {
        // clear the contents after every test
        container.innerHTML = ""
        eventRecorder = resetEventRecorder()
    })

    let eventSystem = {
        onNewNode: (uid: number, pos: Pos) => {
            eventRecorder.newNode = pos
        },
        onMoveNode: (uid: number, oldPos: Pos, newPos: Pos) => { 
            eventRecorder.moveNode = newPos
        },
        onModifyNode: (uid: number, delta: Delta) => {
            eventRecorder.modifyNode = uid
        },
        onDeleteNode: (node: Node) => {
            eventRecorder.deleteNode = node.pos
        },
        onSelectNode: (node: Node) => { 
            eventRecorder.selectNode = node.pos
        },
    }

    type KeyEvent = {
        type: string,
        code: string
    }

    let shift = {
        down: {
            type: "keydown",
            code: "Shift"
        },
        up: {
            type: "keyup",
            code: "Shift"
        }
    }

    let down = "ArrowDown"
    let up = "ArrowUp"
    let left = "ArrowLeft"
    let right = "ArrowRight"
    let enter = "Enter"
    let escape = "Escape"
    let del = "Backspace"

    // FIXME: Add tests using control
    // let ctrl = {
    //     down: {
    //         type: "keydown",
    //         code: "Control"
    //     },
    //     up: {
    //         type: "keyup",
    //         code: "Control"
    //     }
    // }

    let testCases = [
        // {
        //     FIXME: quill doesn't recognise events
        //     name: "can modify the text of a card",
        //     startingTypology: new TreeTypology([1]),
        //     keys: [del, "H", "e", "l", "l", "o"],
        //     assertions: (tree: Tree) => {
        //         console.log(tree.string(true))
        //         let card = tree.getCard()
        //         expect(card.editor.getText()).to.equal("Hello")
        //         expect(card.hasFocus()).to.be.true
        //     }
        // },
        {
            name: "can move to the card below",
            startingTypology: new TreeTypology([2]),
            keys: [escape, down],
            assertions: (tree: Tree) => {
                expect(tree.getCard().pos().equals(new Pos(0, 0, 1))).to.be.true
                expect(eventRecorder.selectNode.equals(new Pos(0, 0, 1))).to.be.true
            }
        },
        {
            name: "can move to the card above",
            startingTypology: new TreeTypology([3]),
            keys: [escape, down, down, up],
            assertions: (tree: Tree) => {
                expect(tree.getCard().pos().equals(new Pos(0, 0, 1))).to.be.true
                expect(eventRecorder.selectNode.equals(new Pos(0, 0, 1))).to.be.true
            }
        },
        {
            name: "can move right to a child node",
            startingTypology: new TreeTypology([2]).pillar([1, 1]),
            keys: [escape, down, right],
            assertions: (tree: Tree) => {
                expect(tree.getCard().pos().equals(new Pos(1, 1, 0))).to.be.true
                expect(eventRecorder.selectNode.equals(new Pos(1, 1, 0))).to.be.true
            }
        },
        {
            name: "can move left to parent node",
            startingTypology: new TreeTypology([2]).pillar([2, 0]),
            keys: [escape, right, down, left],
            assertions: (tree: Tree) => {
                expect(tree.getCard().pos().equals(new Pos())).to.be.true
                expect(eventRecorder.selectNode.equals(new Pos())).to.be.true
            }
        },
        {
            name: "can move to the below card from inside the card",
            startingTypology: new TreeTypology([2]),
            keys: [enter, down, down],
            assertions: (tree: Tree) => {
                let currentCard = tree.getCard()
                expect(currentCard.pos().equals(new Pos(0, 0, 1))).to.be.true
                expect(currentCard.hasFocus()).to.be.true
                expect(eventRecorder.selectNode.equals(new Pos(0, 0, 1))).to.be.true
            }
        },
        // {
        //     FIXME: This test does not work because quill doesn't recognise events
        //     name: "can move to the above card from inside the card",
        //     startingTypology: new TreeTypology([2]),
        //     keys: [escape, down, enter, up, up],
        //     assertions: (tree: Tree) => {
        //         let currentCard = tree.getCard()
        //         expect(currentCard.pos().equals(new Pos())).to.be.true
        //         // TODO: We should actually also assert that it goes specifically to the bottom of this card
        //         expect(currentCard.hasFocus()).to.be.true
        //     }
        // },
        {
            name: "can perform complicated move operations 1",
            startingTypology: new TreeTypology([2]).pillar([1, 3]),
            keys: [escape, down, right, up, left],
            assertions: (tree: Tree) => {
                expect(tree.getCard().pos().equals(new Pos())).to.be.true
                expect(eventRecorder.selectNode.equals(new Pos())).to.be.true
            }
        },
        {
            name: "can perform complicated move operations 2",
            startingTypology: new TreeTypology([2]).pillar([1, 3]),
            keys: [enter, right, escape, down, down, down, left],
            assertions: (tree: Tree) => {
                expect(tree.getCard().pos().equals(new Pos(0, 0, 1))).to.be.true
                expect(eventRecorder.selectNode.equals(new Pos(0, 0, 1))).to.be.true
            }
        },
        {
            name: "can insert a card below",
            startingTypology: new TreeTypology([1]),
            keys: [escape, shift.down, down, shift.up],
            assertions: (tree: Tree) => {
                assertTypology(tree.el, new TreeTypology([2]))
                expect(tree.getCard().pos().equals(new Pos(0, 0, 1))).to.be.true
                expect(eventRecorder.newNode.equals(new Pos(0, 0, 1))).to.be.true
            }
        }, 
        {
            name: "can insert a card above",
            startingTypology: new TreeTypology([1]),
            keys: [escape, shift.down, up, shift.up],
            assertions: (tree: Tree) => {
                assertTypology(tree.el, new TreeTypology([2]))
                expect(tree.getCard().pos().equals(new Pos())).to.be.true
                expect(eventRecorder.newNode.equals(new Pos())).to.be.true
            }
        },
        {
            name: "can insert a child card",
            startingTypology: new TreeTypology([1]),
            keys: [escape, shift.down, right, shift.up],
            assertions: (tree: Tree) => {
                assertTypology(tree.el, new TreeTypology([1]).pillar([1]))
                expect(tree.getCard().pos().equals(new Pos(1,0,0))).to.be.true
                expect(eventRecorder.newNode.equals(new Pos(1,0,0))).to.be.true
            }
        },
        {
            name: "can delete the current card",
            startingTypology: new TreeTypology([2]),
            keys: [escape, del],
            assertions: (tree: Tree) => {
                assertTypology(tree.el, new TreeTypology([1]))
                expect(tree.getCard().id()).to.equal(1)
                expect(eventRecorder.deleteNode.equals(new Pos())).to.be.true
            }
        },
        {
            name: "can insert a card inside the editor",
            startingTypology: new TreeTypology([1]),
            keys: [shift.down, down, shift.up, del],
            assertions: (tree: Tree) => {
                assertTypology(tree.el, new TreeTypology([1]))
                expect(tree.getCard().pos().equals(new Pos(0, 0, 0))).to.be.true
                expect(eventRecorder.newNode.equals(new Pos(0, 0, 1)), "newNode").to.be.true
                expect(eventRecorder.deleteNode.equals(new Pos(0, 0, 1)), "deleteNode").to.be.true
            }
        }
    ]

    testCases.forEach(test => {
        it(test.name, (done) => {
            let tree = new Tree(container, defaultConfig(), test.startingTypology.nodes(), { events: eventSystem})
            // dispatch events with 150 millisecond delay in between each
            test.keys.forEach((key: KeyEvent | string, index: number) => {
                setTimeout(() => {
                    if (typeof key === "string") {
                        document.dispatchEvent(new KeyboardEvent("keydown", { 'key': key }))
                        document.dispatchEvent(new KeyboardEvent("keyup", { 'key': key }))
                    } else {
                        document.dispatchEvent(new KeyboardEvent(key.type, { 'key': key.code }))
                    }
                }, (index + 1) * keySpeed)
            })
            setTimeout(() => {
                test.assertions(tree)
                done()
            }, (test.keys.length + 1) * keySpeed)
        })
    })

    type EventRecorder = {
        newNode: Pos,
        modifyNode: number,
        deleteNode: Pos,
        moveNode: Pos,
        selectNode: Pos
    }

    function resetEventRecorder(): EventRecorder {
        return { 
            newNode: Pos.null(),
            modifyNode: -1,
            deleteNode: Pos.null(),
            moveNode: Pos.null(),
            selectNode: Pos.null(),
        }
    }
})