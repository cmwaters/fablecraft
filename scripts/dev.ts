import * as dotenv from 'dotenv'
import mongoose from 'mongoose';
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { Card, CardModel } from '../models/card'
import { StoryModel } from '../models/story'
import { UserModel } from '../models/user'
import { LoremIpsum } from "lorem-ipsum";
import { Generator } from '../tests/generator'


const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 4
    },
    wordsPerSentence: {
        max: 16,
        min: 4
    }
});

dotenv.config({ path: `config/.env.development` })

const devUser = {
    username: "test",
    email: "test@example.com",
    password: "test"
}

const devStory = { 
    title: "Test Story",
    description: "this is a test story"
}

mongoose.connect(process.env.DATABASE_URL!, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', async () => {
    console.log("Connected to database")
    console.log("Clearing existing database at " + process.env.DATABASE_URL!)
    try {
        await db.dropDatabase()

        await Generator.createUsers(["jimmy", "amanda"])
            .then(gen => gen.createStory("jimmy", "Test Story", 10))
            .then(gen => gen.addEditor("amanda", "Test Story"))
            .catch(err => console.error(err))

        console.log("Closing connection")
        db.close()

    } catch (error) {
        console.log(error)
    }

});
