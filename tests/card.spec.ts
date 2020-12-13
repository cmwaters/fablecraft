process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
import { setupUsersAndTokens, clearUsers, clearStoriesAndCards, createStory, checkUserIsNotPartOfStory, addUserPermission } from "./test_utils"
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { expect } from "chai"
import { CardModel } from "../models/card";
import { PermissionGroup, permissionString } from "../services/permissions";

const defaultCardText = "default test card text"

chai.use(chaiHttp);
describe.only("Card", () => {
    let test_env: any

    afterEach((done) => {
        clearUsers()
        clearStoriesAndCards()
        done()
    })

    beforeEach(done => {
        setupUsersAndTokens(["owner", "editor", "editor", "viewer", "none"]).then((resp: any[]) => {
            test_env = {
                users: resp,
                story: ""
            }
            createStory("Test Story", test_env.users[0].token).then(async (storyID: string) => {
                test_env.story = storyID
                await addUserPermission(test_env.users[1].id, storyID, PermissionGroup.Author)
                await addUserPermission(test_env.users[2].id, storyID, PermissionGroup.Editor)
                await addUserPermission(test_env.users[3].id, storyID, PermissionGroup.Viewer)
                done()
            })
        })
    })

    describe("/POST create card", () => {

        let testResults = [ true, true, false, false, false ]

        testResults.forEach((success, index) => {
            let name = permissionString[4-index] + " should not be able to create a card"
            if (success) {
                name = permissionString[4-index] + " should be able to create a card"
            }  
            it(name, done => {
                chai
                    .request(app)
                    .post("/api/story/" + test_env.story + "/card")
                    .query({ token: test_env.users[index].token })
                    .send({ index: 0, depth: 1, text: defaultCardText })
                    .end((err, res) => {
                        console.log(res.body)
                        if (success) {
                            res.should.have.status(201);
                            res.body.should.have.property("card")
                            res.body.card.text.should.equal(defaultCardText)
                        } else {
                            res.should.have.status(401)
                        }
                        CardModel.find({ story: test_env.story, index: 0, depth: 1 }, (err, card) => {
                            if (success) {
                                expect(card).to.be.not.empty
                            } else {
                                expect(card).to.be.empty
                            }
                            done()
                        })
                    });
            });      
        })

        it.only("should not allow creating a card where one already exists", done => {
            CardModel.create({ 
                story: test_env.story,
                depth: 1,
                index: 2,
                text: defaultCardText
            }).then(() => {
                console.log("story:" + test_env.story + " index: " + 2 + " depth: " + 1)
                CardModel.find({ story: test_env.story, depth: 1, index: 2}, (err, card) => {
                    console.log(card)
                })
                chai
                    .request(app)
                    .post("/api/story/" + test_env.story + "/card")
                    .query({ token: test_env.users[0].token })
                    .send({ index: 2, depth: 1, text: defaultCardText })
                    .end((err, res) => {
                        console.log("result")
                        console.log(res.body)
                        res.should.have.status(200);
                        res.body.should.have.property("error")
                        done()
                    });
            }).catch(err => {
                console.error(err)
            })
        });      
        
        
    })

    describe("/GET cards", () => {
        
    })
});