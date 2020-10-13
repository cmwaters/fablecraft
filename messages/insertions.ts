import { MessageI, MessageError } from './messages'
import { Story } from '../models/story'
import { Card, CardModel } from '../models/card'

export class InsertBelowCardMessage implements MessageI {
  constructor(public siblingId: string) {
    this.siblingId = siblingId
  }
  
  update(story: Story): MessageError | null {
    CardModel.findById(this.siblingId, (err: any, sibling: Card) => {
      if (err) {
        return { reason: err }
      }
      if (sibling.story != story) {
        return { reason: "sibling story does not match. Expected: " + story._id + " got: " + sibling.story._id }
      }
      
      let card = new CardModel({
        text: "",
        story: story,
        depth: sibling.depth,
        index: sibling.index + 1, // note this is just a place marker (could be changed when the graph is serialized)
      })
      
      // card adds sibling
      card.above = sibling
      
      // card inherits the same parent as sibling
      if (sibling.parent !== undefined) {
        card.parent = sibling.parent
        // add card as child of parent
        sibling.parent.children!.push(card)
        sibling.parent.save((err: any, product: Card) => {
          if (err) {
            return { reason: "failed to update parent: " + product._id + " because " + err}
          }
        })
      }
      
      // card adds sibling below and sibling adds new card as it's sibling below
      if (sibling.below !== undefined) {
        card.below = sibling.below
        // let the card below know that it has a new sibling
        card.below.above = card
        card.below.save((err: any, product: Card) => { 
          if (err) {
            return { reason: "failed to update sibling below: " + product._id + " because " + err}
          }
        })
      }
      sibling.below = card
      sibling.save((err: any, product: Card) => {
        if (err) {
          return { reason: "failed to update sibling above: " + product._id + " because " + err}
        }
      })
      
      card.save((err: any, product: Card) => {
        if (err) {
          return { reason: "failed to update newly inserted card: " + product._id + " because " + err}
        }
      })
      
    })
    
    return null
  }
}
