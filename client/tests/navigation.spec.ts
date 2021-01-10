import chai from 'chai'
import chaiDom from 'chai-dom'
import { Card } from '../model/card'
import { Config } from '../config'
import { createCardFamily } from './test_utils'
import { Window } from '../components/window'
import { Vector, Size } from '../geometry'

const DEFAULT_TEST_TITLE = "Test Title"
const DEFAULT_WINDOW_CONFIG = {
  margin: Config.margin,
  card: Config.card,
}

chai.use(chaiDom)
describe("View - Card Navigation", () => {
  let cards: Card[][] = []
  // let body = document.createElement('body')
  describe("basic vertical", () => {
    before(done => {
      cards = [createCardFamily(DEFAULT_TEST_TITLE, 10)]
      done()
    })
    it("should start with the correct configuration", done => {
      // let window = new Window(body, cards, new Vector(), new Size(500, 500), DEFAULT_WINDOW_CONFIG)

    })
  })
  
})