import chai from 'chai';
import { createCardFamily, createCard } from './test_utils'
import { order } from '../model/model'


let should = chai.should();

const DEFAULT_TEST_TITLE = "Test Title"

describe('Card Ordering', () => {
    it("can order a single card", done => {
        order([createCard(DEFAULT_TEST_TITLE)])
    })
    it("keeps order for already ordered cards", (done) => {
        let cards = createCardFamily(DEFAULT_TEST_TITLE, 10)

        done()
    })
})