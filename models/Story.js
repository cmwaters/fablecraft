const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    text: String,
    type: String,
    position: Number,
});

const NoteSchema = new mongoose.Schema({
   text: String,
   cardSchema: [String],
});

const storySchema = new mongoose.Schema({
    title: String,
    color: String,
    cards: [cardSchema],
    notes: [NoteSchema]
});

mongoose.model('card', cardSchema);
mongoose.model('note', NoteSchema);
mongoose.model('story', storySchema);

