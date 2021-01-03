import * as dotenv from 'dotenv'
import mongoose from 'mongoose';
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { Card, CardModel } from '../models/card'
import { StoryModel } from '../models/story'
import { UserModel } from '../models/user'
import { LoremIpsum } from "lorem-ipsum";


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

        const salt = randomBytes(32);
        const passwordHashed = await argon2.hash(devUser.password, { salt });

        console.log("Creating user")
        let user = await UserModel.create({ 
            username: devUser.username,
            email: devUser.email, 
            password: passwordHashed,
            name: devUser.username, 
            stories: [],
            lastStory: undefined,
        })

        console.log("Creating story")
        let story = await StoryModel.create({ 
            title: devStory.title, 
            description: devStory.description, 
            owner: user.id
        })

        user.lastStory = story
        await user.save()

        console.log("Creating cards")
        await generateCards(story._id, 0, 3, 7)

        console.log("Closing connection")
        db.close()

    } catch (error) {
        console.log(error)
    }

});

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}


async function generateCards(storyId: any, depth: number, min: number, max: number, parent?: Card) {
    let range = getRandomInt(min, max)
    let column = []

    for (let index = 0; index < range; index++) {
        column.push( await CardModel.create({
            story: storyId, 
            text: lorem.generateParagraphs(1),
            depth: depth,
            index: index,
        }))
    }

    for (let index = 0; index < range; index++) {
        if (parent !== undefined) {
            column[index].parent = parent._id
            parent.children!.push(column[index]._id)
        }
        if (index !== 0) {
            column[index].above = column[index - 1]._id
        }
        if (index !== range - 1) {
            column[index].below = column[index + 1]._id
        }
        // at most stories can have a depth of 3
        if (depth < 3 && getRandomInt(0, 2) === 0) {
            generateCards(storyId, depth + 1, min - 1, max - 1, column[index])
        }

        await column[index].save()
    }

    if (parent !== undefined) {
        await parent.save()
    }

} 
