import * as mongoose from 'mongoose'
const Author = mongoose.model('Author')

const CardSchema = new mongoose.Schema({
    uid: {
        type: Number,
        unique: true,
        required: true
    },
    text: {
        type: String,
        required: true,
    },
    depth: {
        type: Number,
        required: true,
    },
    index: {
        type: Number,
        required: true,
    },
    owner: {
        type: Author,
        required: true
    },
});

// const NoteSchema = new mongoose.Schema({
//    text: String,
//    cardSchema: [String],
// });

// const storySchema = new mongoose.Schema({
//     title: String,
//     color: String,
//     cards: [cardSchema],
//     notes: [NoteSchema]
// });

export default mongoose.model<mongoose.Document>('Card', CardSchema);
// mongoose.model('note', NoteSchema);
// mongoose.model('story', storySchema);

