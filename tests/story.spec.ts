process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { setupUsersAndTokens, clearUsers, clearStoriesAndCards, createStory } from "./test_utils"
import { storyErrors } from "../routes/errors";
import { StoryModel } from "../models/story";

let should = chai.should();
// let expect = chai.expect;

chai.use(chaiHttp);
// NOTE: all tests within each describe are dependent on one another 
describe("Story", () => {
    afterEach((done) => {
        clearUsers()
        clearStoriesAndCards()
        done()
    })

    describe("/POST story", () => {
        let token: string = ""
        beforeEach((done) => {
            setupUsersAndTokens(["user"])
                .then((resp: any[]) => {
                    token = resp[0].token;
                    done()
                })
                .catch((err: any) => {
                    console.error(err);
                })
        })


        it("can create stories", done => {
            let story = {
                title: "Test Story",
                description: "A story about tests"
            }
            chai
                .request(app)
                .post("/api/story")
                .query({ token: token })
                .send(story)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.have.property("title")
                    res.body.title.should.equals(story.title)
                    res.body.should.have.property("description")
                    res.body.description.should.equals(story.description)
                    res.body.should.have.property("_id")
                    let storyId = res.body._id
                    chai
                        .request(app)
                        .get("/api/story")
                        .query({ token: token })
                        .end((err, res) => {
                            res.should.have.status(200)
                            res.body.should.have.length(1)
                            res.body[0].should.equals(storyId)
                            done();
                        });
                });
        });

        it("should not create stories without a title", done => {
            chai
                .request(app)
                .post("/api/story")
                .query({ token: token })
                .send({ message: "Hello" })
                .end((err, res) => {
                    // console.log(res)
                    res.should.have.status(400);
                    res.body.should.have.property("error")
                    res.body.error.should.equals("empty title");
                    // when we request all stories we should just have the original one
                    chai
                        .request(app)
                        .get("/api/story")
                        .query({ token: token })
                        .end((err, res) => {
                            res.should.have.status(200)
                            res.body.should.have.length(0)
                            done();
                        });

                });
        })

    })
    
    describe("/GET story", () => {
        let token: string = ""
        beforeEach((done) => {
            setupUsersAndTokens(["user"])
                .then((resp: any[]) => {
                    token = resp[0].token;
                    done()
                })
                .catch((err: any) => {
                    console.error(err);
                })
        })

        it("can retrieve existing stories", done => {
            createStory("Test Story", token).then((storyId: string) => {
                chai
                    .request(app)
                    .get("/api/story/" + storyId)
                    .query({ token: token })
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property("title")
                        res.body.title.should.equals("Test Story");
                        done()
                    });
            });
        })

        it("errors when it doesn't have the story", done => {
            chai
                .request(app)
                .get("/api/story/5fc6a36c86e19483774f3ff7") // random id
                .query({ token: token })
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.have.property("error")
                    res.body.error.should.equals(storyErrors.StoryNotFound)
                    done();
                })
        })

        it("doesn't allow access to accounts that do not have permission", done => {
            setupUsersAndTokens(["second_user"]).then((resp: any[]) => {
                createStory("Test Story", token).then((storyId: string) => {
                    chai
                        .request(app)
                        .get("/api/story/" + storyId)
                        .query({ token: resp[0].token })
                        .end((err, res) => {
                            res.should.have.status(200)
                            res.body.should.have.property("error")
                            res.body.error.should.equals(storyErrors.UserPermissionDenied)
                            done()
                        })
                });
            })
        })
    })

    describe("/DELETE story", () => {
        let test_env: any
        beforeEach(done => {
            setupUsersAndTokens(["authorized_user", "unauthorized_user"]).then((users: any[]) => {
                createStory("Test Story", users[0].token).then((res: string) => {
                    test_env = {
                        users: users,
                        storyId: res
                    }
                    done()
                });
            });
        });

        it("should not allow unauthorized users to delete a story", done => {
            chai
                .request(app)
                .delete("/api/story/" + test_env.storyId)
                .query({ token: test_env.users[1].token })
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.have.property("error")
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    // authorized user should still have access to the 
                    chai
                        .request(app)
                        .get("/api/story/" + test_env.storyId)
                        .query({ token: test_env.users[0].token })
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property("title")
                            done()
                        });
                });
        })

        it("should not allow non-users to delete a story", done => {
            chai
                .request(app)
                .delete("/api/story/" + test_env.storyId)
                .query({ token: "hello" })
                .end((err, res) => {
                    res.should.have.status(401)
                    // authorized user should still have access to the 
                    chai
                        .request(app)
                        .get("/api/story/" + test_env.storyId)
                        .query({ token: test_env.users[0].token })
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property("title")
                            done()
                        });
                });
        })

        it("can delete stories", done => {
            chai
                .request(app)
                .delete("/api/story/" + test_env.storyId)
                .query({ token: test_env.users[0].token })
                .end((err, res) => {
                    res.should.have.status(204)
                    res.body.should.be.empty
                    chai
                        .request(app)
                        .get("/api/story/" + test_env.storyId)
                        .query({ token: test_env.users[0].token })
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property("error")
                            res.body.error.should.equals(storyErrors.StoryNotFound);
                            done()
                        });
                })
        })
    })

    describe.only("/POST story permission", () => {
        let test_env: any
        beforeEach(done => {
            // we set up three users, one is the owner, the next has the permission we are testing, and the
            // last is the permission we are adjusting / adding
            setupUsersAndTokens(["1", "2", "3"])
                .then((res: any[]) => {
                    createStory("Test Story", res[0].token) // 1 is always owner
                        .then((id) => {
                            test_env = {
                                users: res,
                                storyId: id
                            }
                            done()
                        })
                })
                .catch((err) => {
                    console.log(err)
                });
        })

        let testCases = [
            {
                name: "owner can give all permissions to users",
                querier: 0,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {},
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(204)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        switch (permissionLevel) {
                            case 1: 
                                story!.viewers!.should.contain(test_env.users[2].id)
                                break;
                            case 2:
                                story!.editors!.should.contain(test_env.users[2].id)
                                break;
                            case 3:
                                story!.authors!.should.contain(test_env.users[2].id)
                                break;
                            case 4:
                                story!.owner._id.toString().should.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            }, 
            {
                name: "author can give viewer and editor permissions to users",
                querier: 1,
                prep: async (permissionLevel: number, test_env:any ): Promise<void> => {
                    // make user 1 an author
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { authors: [test_env.users[1].id]}, (err, result) => { 
                        if (err) { console.error(err); }
                    }); 
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        story!.authors!.should.contain(test_env.users[1].id)

                        switch (permissionLevel) {
                            case 1: 
                                res.should.have.status(204)
                                story!.viewers!.should.contain(test_env.users[2].id)
                                break;
                            case 2:
                                res.should.have.status(204)
                                story!.editors!.should.contain(test_env.users[2].id)
                                break;
                            case 3:
                                res.should.have.status(200)
                                res.body.should.have.property('error')
                                res.body.error.should.equals(storyErrors.UserPermissionDenied)
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                res.should.have.status(200)
                                res.body.should.have.property('error')
                                res.body.error.should.equals(storyErrors.UserPermissionDenied)
                                story!.owner._id.toString().should.not.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            }
        ]

        testCases.forEach(test => {
            for (let permissionLevel = 1; permissionLevel < 5; permissionLevel++) {
                
                it(test.name + ' - ' + permissionLevel, done => {
                    test.prep(permissionLevel, test_env).then(() => {
                        chai
                        .request(app)
                        .post("/api/story/" + test_env.storyId + "/permissions")
                        .query({ token: test_env.users[test.querier].token }) 
                        // we always use the second / last user to modify permission
                        .send({ user: test_env.users[2].id, permission: permissionLevel })
                        .end((err, res) => {
                            if (err) {
                                console.error(err)
                            }
                            test.assertions(res, permissionLevel, test_env).then(() => { done() })
                        });
                    })
                    .catch((err) => console.error(err))
                    
                })
            }
        })

    });
    
    
});

