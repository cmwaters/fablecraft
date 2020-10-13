
import { Story } from './../models/story'
import { Card } from './../models/card'
import { User } from './../models/user'
import { MessageSet } from '../messages/messages'

export type GraphError = {
  reason: string
}

export namespace StoryGraph {

  // EXPORTED FUNCTIONS
  
  export function serializeGraph(story: Story): { cards: Card[], err: GraphError | null } {
    return { cards: [], err: null }
  }
  
  export function newGraph(user: User, title: string, description?: string): GraphError | null {
    // let story = new StoryModel({
    //   title: title,
    //   description: description,
    //   owner: user._id,
    // });
    // CardModel.create({
    //   text: "",
    //   story: story,
    //   depth: 0,
    //   index: 0,
    // }, (err: any, card: Card) => {
    //   if (err) {
    //     return res.status(200)
    //   }
    // });
    // story.rootCard = rootCard;
    // story.;
    // return res
    //   .status(201)
    //   .send({ message: "success. " + story.title + " created." });
  
    return null
  } 
  
  export function processMessages(msgs: MessageSet): GraphError | null {
    
  
    return null
  }

  // inserts a card into the tree, it verifies the card and thus returns an error as a string if there is something wrong
  // export function insertCard(story: Story, card: Card): string {
  //   // is the first card in the story
  //   if (story.cards === undefined) {
  //     if (card.depth !== 0 || card.index !== 0) {
  //       return "this is the first card in the story. Expected depth and index to be 0. Got " + card.depth + " and " + card.index
  //     }
  //     story.cards = [[card]]
  //     story.save()
  //     return ""
  //   } 
    
  //   // check card index is valid
  //   if (card.index < 0 || card.depth) {
  //     return "expected a non negative index and/or depth value: got depth: " + card.depth + ", index: " + card.index
  //   }
    
  //   // check depth doesn't exceed story length
  //   if (card.depth > story.cards.length) {
  //     return "card depth is more than one greater than the story depth. Got " + card.depth
  //   }
    
  //   // inserting card at a new depth
  //   if (card.depth >= story.cards.length ) {
  //     if (card.index !== 0) {
  //       return "inserting card at a new depth, thus expecting index to be 0. Got " + card.index
  //     }
  //     story.cards.push([card])
  //   }
      
  //   // check index doesn't exceed maximum index at that depth
  //   if (card.index > story.cards[card.depth].length) {
  //     return "card index is more than one greater than the maximum index at that depth. Got " + card.index
  //   }
    
  //   // inserting a card where there is already a card at that index in which case we must push everything down
  //   story.cards[card.depth].splice(card.index, 0, card)
    
  //   // shift the index of all cards below by one
  //   shiftIndex(story, card.depth, card.index + 1)
  //   story.save()
    
  //   return ""
  // }
  
  // export function deleteCard(story: Story, card: Card): string {
  //   return ""
  // }
  
  // export function moveCard(story: Story, card: Card, newDepth: number, newIndex: number): string {
  //   return ""
  // }
  
  // export function getCard(story: Story, depth: number, index: number, text?: string): Card {
    
  // }
  
  
  // // PRIVATE FUNCTIONS
  
  // function shiftIndex(story: Story, depth: number, index: number): void {
  //   if (story.cards == undefined) { return }
  //   for (let idx = index; idx < story.cards[depth].length; idx++ ) {
  //     story.cards[depth][idx].index = idx
  //     // check if this is not the final depth, in which case we need to update the parent index
  //     if (depth < story.cards.length - 1) { 
  //       for (let idx = 0; idx < story.cards[depth + 1].length; idx++ ) {
  //         if (story.cards[depth + 1][idx].parentIndex >= index) {
  //           story.cards[depth + 1][idx].parentIndex++
  //           story.cards[depth + 1][idx].save()
  //         }
  //       }
  //     }
  //     story.cards[depth][idx].save()
  //   }
  // }

}