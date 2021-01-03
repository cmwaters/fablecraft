import chai from 'chai';
import { createCardFamily, createCard, validateCardFamily } from './test_utils'
import { order } from '../model/model'

let should = chai.should();

const DEFAULT_TEST_TITLE = "Test Title"

describe.only("Model", () => {
    describe('Card Ordering', () => {
        it("can order a single card", done => {
            let cards = order([createCard(DEFAULT_TEST_TITLE)])
            cards.should.have.length(1)
            cards[0].should.have.length(1)
            done()
        })
        it("keeps order for already ordered cards", (done) => {
            let cards = createCardFamily(DEFAULT_TEST_TITLE, 10)
            let orderedCards = order(cards)
            orderedCards.should.have.length(1)
            orderedCards[0].should.have.length(cards.length)
            validateCardFamily(orderedCards[0]).should.be.true
            done()
        })
        it("orders unordered cards", (done) => {
            let cards = createCardFamily(DEFAULT_TEST_TITLE, 10);
            // swap 1 and 3
            [cards[1], cards[3]] = [cards[3], cards[1]];
            let orderedCards = order(cards)
            orderedCards.should.have.length(1)
            orderedCards[0].should.have.length(cards.length)
            validateCardFamily(orderedCards[0]).should.be.true
            done()
        })
        it.only("orders completely reversed ordered cards", (done) => {
            let cards = createCardFamily(DEFAULT_TEST_TITLE, 10).reverse();
            console.log(cards)
            let orderedCards = order(cards)
            orderedCards.should.have.length(1)
            orderedCards[0].should.have.length(cards.length)
            validateCardFamily(orderedCards[0]).should.be.true
            done()
        })
    })
})
