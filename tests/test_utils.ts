import { UserModel, User } from "../models/user";
import { Story, StoryModel } from "../models/story";
import { Card, CardModel } from "../models/card";
import { app } from "../index";
import { randomBytes } from "crypto";
import * as argon2 from "argon2";

import chai from "chai";
import chaiHttp from "chai-http";
import { PermissionGroup } from "../services/permissions";
import { errors } from "../routes/errors"

export const DEFAULT_CARD_TEXT = "default test card text";
export const TEST_PASSWORD = "TrustN01"

// XXX: Perhaps it's better to use something else than the test framework for creating users and tokens
chai.use(chaiHttp);
export async function setupUsersAndSession(users: number): Promise<SessionEnv> {
    return new Promise( async (resolve, reject) => {
        let resp: SessionEnv = {
            users: [],
            cookie: "",
        }
        for (let i = 0; i < users; i++) {
            const salt = randomBytes(32);
            const passwordHashed = await argon2.hash(TEST_PASSWORD + i, { salt });

            resp.users.push(await UserModel.create({
                username: "user" + i,
                email: "user" + i + "@example.com",
                password: passwordHashed,
                name: "user" + i,
                stories: [],
                lastStory: undefined,
            }));         
        }
        // we create a session with the first user only
        chai.request(app)
            .post("/auth/login")
            .send({
                email: "user0@example.com",
                password: "user0",
            })
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                if (res.status !== 200 || res.body.error) {
                    reject(res.body);
                }
                res.header.should.have.property("set-cookie")
                resp.cookie = res.header["set-cookie"]
                resolve(resp);
            });
    });
}

export type SessionEnv = {
    users: User[],
    cookie: string
}

export type TestEnv = {
    users: User[],
    cookie: string,
    story: Story,
    cards: Card[]
}

export async function createSession(id: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        chai.request(app)
            .post("/auth/login")
            .send({
                email: "user" + id + "@example.com",
                password: "user" + id,
            })
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                if (res.status !== 200 || res.body.error) {
                    reject(res.body)
                }
                res.header.should.have.property("set-cookie")
                resolve(res.header["set-cookie"]);
            });
    })
}

// NOTE: create story doesn't automatically create a root card
export function createStory(user: User, title?: string): Promise<Story> {
    return new Promise((resolve, reject) => {
        let storyTitle = "Test Story"
        if (title) {
            storyTitle = title
        }
        resolve(StoryModel.create({
            title: storyTitle,
            owner: user._id
        }))
    });
}

export function assertLastStory(storyID: string, cookie: string, done: () => void): void { 
    chai
        .request(app)
        .get("/api/story/last")
        .set("cookie", cookie)
        .end((err, res) => {
            if (err) { console.error(err)}
            res.should.have.status(200)
            res.body.should.have.property("_id")
            res.body._id.should.equal(storyID)
            done()
        });
}

export function assertNoLastStory(cookie: string, done: () => void): void {
    chai
        .request(app)
        .get("/api/story/last")
        .set("cookie", cookie)
        .end((err, res) => {
            if (err) { console.error(err)}
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.error.should.equals(errors.StoryNotFound)
            done()
        });
}

export async function createCardColumn(storyID: any, length: number, depth: number = 0, parent?: Card): Promise<Card[]> {
    return new Promise<Card[]>(async (resolve, reject) => {
        let cards: Card[] = []
        for (let i = 0; i < length; i++) {
            cards.push(await CardModel.create({
                story: storyID,
                text: DEFAULT_CARD_TEXT,
                depth: depth,
                index: i
            }))
        }

        for (let index = 0; index < length; index++) {
            if (parent !== undefined) {
                cards[index].parent = parent._id
                parent.children!.push(cards[index]._id)
            }
            if (index !== 0) {
                cards[index].above = cards[index - 1]._id
            }
            if (index !== length - 1) {
                cards[index].below = cards[index + 1]._id
            }

            await cards[index].save()
        }

        if (parent !== undefined) {
            await parent.save()
        }

        resolve(cards)
    });
}

export async function clearUsers() {
    await UserModel.deleteMany({}, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

export async function clearStoriesAndCards() {
    await CardModel.deleteMany({}, (err) => {
        if (err) {
            console.log(err);
        }
    });
    await StoryModel.deleteMany({}, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

export async function checkUserIsNotPartOfStory(userID: string, storyID: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        StoryModel.findById(storyID, (err: any, story: Story) => {
            if (err) {
                console.error(err);
            }
            UserModel.findById(userID, (err: any, user: User) => {
                if (err) {
                    console.error(err);
                }
                if (story.getPermission(user) === PermissionGroup.None) {
                    resolve(true);
                }
                resolve(false);
            });
        });
    });
}

export async function addUserPermission(userID: any, storyID: any, permission: PermissionGroup) {
    switch (permission) {
        case PermissionGroup.Owner:
            return await StoryModel.findByIdAndUpdate(storyID, { owner: userID });
        case PermissionGroup.Author:
            return await StoryModel.findByIdAndUpdate(storyID, { authors: [userID] });
        case PermissionGroup.Editor:
            return await StoryModel.findByIdAndUpdate(storyID, { editors: [userID] });
        case PermissionGroup.Viewer:
            return await StoryModel.findByIdAndUpdate(storyID, { viewers: [userID] });
        default:
            return;
    }
}
