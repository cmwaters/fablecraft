# Cards

The atomic element of each story is the card. This is structured in a ordered tree hierarchy with each card posessing the following properties:

```javascript 
type Card = {
    text: string,
    parent: Card,
    children: Card[],
    above: Card, // sibling
    below: Card, // sibling

    // other internal properties
}
```

Cards are designed to have the full flexibility to be moved around. They can be shifted aboved and below their sibling cards, thus shifting all the children the card has. They can also be moved back to the layer of their parents.

Cards can be deleted - which deletes all the children. They can be created above or below a sibling card or be branched off a parent card. 

All cards eventually lead to an immutable root card which is embedded in the story struct itself. 

As well as the content of the card itself, the card is the node which many other features are based off such as comments, elements, trails, and suggestions. 

