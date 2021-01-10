import chai from "chai";
import chaiDom from "chai-dom";
import { Card } from "../model/card";
import { Config } from "../config";
import { JSDOM } from "jsdom";
import { createCardFamily } from "./test_utils";
import { Vector, Size } from "../geometry";
import Quill from 'quill'

const DEFAULT_TEST_TITLE = "Test Title";
const DEFAULT_WINDOW_CONFIG = {
    margin: Config.margin,
    card: Config.card,
};

let should = chai.should();
chai.use(chaiDom);
describe.only("Window - Initialization", () => {
    let cards: Card[][] = [];
    beforeEach(done => {
        const dom = new JSDOM(
            `<html>
              <body>
              </body>
            </html>`,
            { url: "http://localhost" }
        );

        global.document = dom.window.document;
        cards = [createCardFamily(DEFAULT_TEST_TITLE, 10)];
        done();
    });
    it("should start with the correct configuration", (done) => {
        console.log(document)
        console.log("hi");
        let screen = document.createElement("div");
        document.body.appendChild(screen)
        console.log(document)
        let editor = new Quill(screen)
        editor.setText("Hello World")
        console.log(editor.getText())
        // let window = new Window(screen, cards, new Vector(), new Size(500, 500), DEFAULT_WINDOW_CONFIG);
        // window.el.offsetHeight.should.equal(500)
        // window.el.offsetWidth.should.equal(500)
        done();
    });
});
