import * as dotenv from "dotenv";
import mongoose from "mongoose";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { StoryModel } from "../models/story";
import { Card, CardModel } from "../models/card";
import { LoremIpsum } from "lorem-ipsum";

dotenv.config();

const textGen = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 32,
    min: 8,
  },
});

const storyTree = [5];

mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost/fablecraft", {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", async () => {
  console.log(
    "Connected to database. Beginning to populate database with test data..."
  );
  await populate();
  setTimeout(() => {
    "Closing database connection";
    db.close();
  }, 200);
});

async function populate() {
  const salt = randomBytes(32);
  const passwd = await argon2.hash("test", { salt });
  UserModel.exists({ email: "test" }, function (err, user) {
    if (err) {
      console.log(err);
    } else if (user) {
      console.log("user already exists: " + user);
      return;
    } else {
      console.log("creating mock user");
      let testUser = new UserModel({
        email: "test",
        password: passwd,
      });
      testUser.save();
      let cards = generateCards(testUser);

      StoryModel.create({
        title: "Lorem Ipsum",
        cards: cards,
        owner: testUser,
      });
    }
  });
}

function generateCards(user: User): Card[] {
  let cards: Card[] = [];
  for (let depth = 0; depth < storyTree.length; depth++) {
    for (let index = 0; index < storyTree[depth]; index++) {
      let card = new CardModel({
        text: textGen.generateParagraphs(randInt(3)),
        depth: depth,
        index: index,
        parentIndex: null,
        owner: user,
      });
      card.save()
      cards.push(card);
    }
  }
  return cards;
}
function randInt(max: number, min?: number): number {
  if (min === undefined) min = 0;
  return Math.round(Math.random() * (max - min) + min);
}
