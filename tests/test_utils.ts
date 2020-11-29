import { UserModel } from "../models/user"
import { StoryModel } from "../models/story"
import { CardModel } from "../models/card"
import { app } from "../index";

import chai from "chai"
import chaiHttp from "chai-http";

// XXX: Perhaps it's better to use something else than the test framework for creating users and tokens
chai.use(chaiHttp)
export async function setupUserAndToken(name: string): Promise<string> {
  return new Promise( (resolve, reject) => {
      chai
          .request(app)
          .post("/auth/signup")
          .send({
              email: name + "@example.com",
              password: name
          })
          .end((err, res) => {
              if (err) {
                  reject(err)
              }
              resolve(res.body.token)
          })
  })
}

export async function clearUsers() {
  await UserModel.deleteMany({}, (err) => {
      if (err) {
          console.log(err);
      }
  })
}

export async function clearStoriesAndCards() {
  await CardModel.deleteMany({}, (err) => {
      if (err) {
          console.log(err);
      }
  })
  await StoryModel.deleteMany({}, (err) => {
      if (err) {
          console.log(err);
      }
  })
}