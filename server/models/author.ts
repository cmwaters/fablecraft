import * as mongoose from 'mongoose'

interface Author {
    email: string;
    password: string;
    name?: string;

}

const AuthorSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: { // this is a hash of the actual users password
        type: String,
        required: true,
    },
    name: String,
})

export default mongoose.model<Author & mongoose.Document>('Author', AuthorSchema)
