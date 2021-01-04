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
            validateCardFamily(orderedCards[0]).should.equals("valid")
            done()
        })
        it("orders unordered cards", (done) => {
            let cards = createCardFamily(DEFAULT_TEST_TITLE, 10);
            // swap 1 and 3
            [cards[1], cards[3]] = [cards[3], cards[1]];
            let orderedCards = order(cards)
            orderedCards.should.have.length(1)
            orderedCards[0].should.have.length(cards.length)
            validateCardFamily(orderedCards[0]).should.equals("valid")
            done()
        })
        it("orders completely reversed ordered cards", (done) => {
            let cards = createCardFamily(DEFAULT_TEST_TITLE, 10).reverse();
            let orderedCards = order(cards)
            orderedCards.should.have.length(1)
            orderedCards[0].should.have.length(cards.length)
            validateCardFamily(orderedCards[0]).should.equals("valid")
            done()
        })
        it("orders stories with multi-layered cards", (done) => {
            let cards = createCardFamily(DEFAULT_TEST_TITLE, 10);
            cards.push(...createCardFamily(DEFAULT_TEST_TITLE, 5, 0, 1, cards[4]._id));
            cards.push(...createCardFamily(DEFAULT_TEST_TITLE, 3, 5, 1, cards[6]._id, cards[14]._id));
            // swap a few cards
            [cards[1], cards[3]] = [cards[3], cards[1]];
            [cards[11], cards[13]] = [cards[13], cards[11]];
            [cards[16], cards[17]] = [cards[17], cards[16]];
            cards[14].below = cards[15]._id
            let orderedCards = order(cards)
            orderedCards.should.have.length(2)
            orderedCards[0].should.have.length(10)
            orderedCards[1].should.have.length(8)
            validateCardFamily(orderedCards[0]).should.equals("valid")
            validateCardFamily(orderedCards[1].slice(0, 5), 1, cards[4]._id, undefined, cards[15]._id).should.equals("valid")
            validateCardFamily(orderedCards[1].slice(5, 8), 1, cards[6]._id, cards[14]._id).should.equals("valid")
            done()
        })
    })
})
