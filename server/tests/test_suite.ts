import { UserModel, User } from "../models/user";
import { DocumentModel } from "../models/header";
import { Document } from '../services/document'
import { CardModel } from "../models/card";
import { app } from "../index";
import { randomBytes } from "crypto";
import * as argon2 from "argon2";

import chai from "chai";
import chaiHttp from "chai-http";
import { PermissionGroup } from "../services/permissions";

chai.use(chaiHttp);

export const DEFAULT_CARD_TEXT = "default test card text";
export const DEFAULT_DOCUMENT_TITLE = "Test Document"
export const TEST_PASSWORD = "TrustN01"

export type SessionedUser = {
    user: User
    cookie: string
}

export class TestSuite {
    users: SessionedUser[]
    documents: Document[]

    constructor(users?: SessionedUser[], documents?: Document[]) {
        if (users) {
            this.users = users
        } else {
            this.users = []
        }
        if (documents) {
            this.documents = documents
        } else {
            this.documents = []
        }
    }

    static async setup(users: number): Promise<TestSuite> {
        let testSuite = new TestSuite()

        for (let i = 0; i < users; i++) {
            testSuite.users.push(await newSessionedUser("user" + i))
        }

        return testSuite
    }

    static async clear() {
        await CardModel.deleteMany({}, undefined, (err) => {
            if (err) {
                console.log(err);
            }
        });
        await DocumentModel.deleteMany({}, undefined, (err) => {
            if (err) {
                console.log(err);
            }
        });
        await UserModel.deleteMany({}, undefined, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    async newDocument(userId?: string, title: string = DEFAULT_DOCUMENT_TITLE) {
        if (userId === undefined) {
            // if we haven't got a user then create one
            if (this.users.length === 0) {
                this.users.push(await newSessionedUser("user0"))
            }
            let user = this.users[0].user
            this.documents.push(await Document.create(user, title))
        } else {
            for (let i = 0; i < this.users.length; i++) {
                if (this.users[i].user._id === userId) {
                    let user = this.users[i].user
                    this.documents.push(await Document.create(user, title))
                    return
                }
            }
        }
    }

    static async addUserPermission(userID: any, storyID: any, permission: PermissionGroup) {
        switch (permission) {
            case PermissionGroup.Owner:
                return await DocumentModel.findByIdAndUpdate(storyID, { owner: userID });
            case PermissionGroup.Author:
                return await DocumentModel.findByIdAndUpdate(storyID, { authors: [userID] });
            case PermissionGroup.Editor:
                return await DocumentModel.findByIdAndUpdate(storyID, { editors: [userID] });
            case PermissionGroup.Viewer:
                return await DocumentModel.findByIdAndUpdate(storyID, { viewers: [userID] });
            default:
                return;
        }
    }
}

async function newSessionedUser(id: string): Promise<SessionedUser> {
    const salt = randomBytes(32);
    const passwordHashed = await argon2.hash(TEST_PASSWORD, { salt });

    let user = await UserModel.create({
        username: id,
        email: id + "@example.com",
        password: passwordHashed,
        name: id,
        documents: [],
        lastDocument: undefined,
    });

    return new Promise<SessionedUser>((resolve, reject) => {
        chai.request(app)
            .post("/auth/login")
            .send({
                email: user.email,
                password: TEST_PASSWORD,
            })
            .end((err, res) => {
                if (err) { reject(err) }
                res.header.should.have.property("set-cookie")
                resolve({
                    user: user,
                    cookie: res.header["set-cookie"]
                })
            })
    })
    
}

