import puppeteer from 'puppeteer'
import chai from 'chai'
import { Tree } from '../tree'
import { JSDOM } from 'jsdom'

let should = chai.should();
let expect = chai.expect

describe("tree", () => {
    it("compose an epic", async () => {
        const dom = new JSDOM(`
        <!DOCTYPE html>
            <p>Hello world</p>
        `);
        expect(dom.window.document.querySelector("p")!.textContent).to.equal("Hello world")
    })
})
