process.env.NODE_ENV = 'development';
import * as dotenv from 'dotenv'
import mongoose from 'mongoose';
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { Card, CardModel } from '../models/card'
import { Story, StoryModel } from '../models/story'
import { User, UserModel } from '../models/user'

dotenv.config({ path: `../config/.env.${process.env.NODE_ENV}` })

const devUser = {
    name: "test",
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
            email: devUser.email, 
            password: passwordHashed,
            name: devUser.name, 
            stories: [],
        })

        console.log("Creating story")
        let story = await StoryModel.create({ 
            title: devStory.title, 
            description: devStory.description, 
            owner: user.id
        })

        console.log("Creating cards")
        await CardModel.create({
            story: story.id, 
            text: "Welcome to fablecraft!",
            depth: 0,
            index: 0,
        })

        console.log("Closing connection")
        db.close()

    } catch (error) {
        console.log(error)
    }

});

