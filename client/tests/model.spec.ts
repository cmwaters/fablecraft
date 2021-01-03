import chai from 'chai';
import { createCardFamily, createCard } from './test_utils'
import { order } from '../model/model'

let should = chai.should();

const DEFAULT_TEST_TITLE = "Test Title"

describe.only("Model", () => {
    describe('Card Ordering', () => {
        it("can order a single card", done => {
            let cards = order([createCard(DEFAULT_TEST_TITLE)])
            cards.should.have.length(1)
            done()
        })
        it("keeps order for already ordered cards", (done) => {
            let cards = createCardFamily(DEFAULT_TEST_TITLE, 10)
            let orderedCards = order(cards)
            done()
        })
    })
})
