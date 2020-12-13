import { UserModel, User } from "../models/user"
import { Story, StoryModel } from "../models/story"
import { CardModel } from "../models/card"
import { app } from "../index";

import chai from "chai"
import chaiHttp from "chai-http";
import { PermissionGroup } from "../services/permissions";

// XXX: Perhaps it's better to use something else than the test framework for creating users and tokens
chai.use(chaiHttp)
export async function setupUsersAndTokens(names: string[]): Promise<any[]> {
  return new Promise( (resolve, reject) => {
        let resp: any[] = []
        for (let i = names.length - 1; i >= 0; i--) {
            chai
                .request(app)
                .post("/auth/signup")
                .send({
                    email: names[i] + "@example.com",
                    password: names[i]
                })
                .end((err, res) => {
                    if (err) {
                        reject(err)
                    }
                    resp.push({ token: res.body.token, id: res.body.user._id})
                    if (i === names.length - 1) {
                        resolve(resp)
                    }
                })
        }
  })
}

export function createStory(name: string, token: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        chai
            .request(app)
            .post("/api/story")
            .query({ token: token })
            .send({ title: name })
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.body._id)
            });
    })
    
}

export async function addCard(storyID: any, depth: number, index: number, text: string) {
    return await CardModel.create({ 
        story: storyID,
        depth: depth,
        index: index, 
        text: text
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

export async function checkUserIsNotPartOfStory(userID: string, storyID: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>{
        StoryModel.findById(storyID, (err: any, story: Story) => {
            if (err) { console.error(err); }
            UserModel.findById(userID, (err: any, user: User) => {
                if (err) { console.error(err); }
                if (story.getPermission(user) === PermissionGroup.None) {
                    resolve(true);
                }
                resolve(false);
            })
            
        })
    })
}

export async function addUserPermission(userID: any, storyID: any, permission: PermissionGroup) {
    switch (permission) {
        case PermissionGroup.Owner:
            return await StoryModel.findByIdAndUpdate(storyID, { owner: userID } )
        case PermissionGroup.Author:
            return await StoryModel.findByIdAndUpdate(storyID, { authors: [userID] })
        case PermissionGroup.Editor:
            return await StoryModel.findByIdAndUpdate(storyID, { editors: [userID] })
        case PermissionGroup.Viewer:
            return await StoryModel.findByIdAndUpdate(storyID, { viewers: [userID] })
        default:
            return 
    }
}