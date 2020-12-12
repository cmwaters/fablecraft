process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { setupUsersAndTokens, clearUsers, clearStoriesAndCards, createStory, checkUserIsNotPartOfStory, addUserPermission } from "./test_utils"
import { storyErrors } from "../routes/errors";
import { StoryModel } from "../models/story";
import { PermissionGroup } from "../messages/messages";

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

    describe("/POST story permission", () => {
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
                                // this is a change in ownership - the previous owner should
                                // automatically become an author
                                story!.authors!.should.contain(test_env.users[0].id)
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
            },
            {
                name: "editor can not give any permissions to users",
                querier: 1,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // make user 1 an editor
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { editors: [test_env.users[1].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(200)
                    res.body.should.have.property('error')
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        story!.editors!.should.contain(test_env.users[1].id)

                        switch (permissionLevel) {
                            case 1:
                                story!.viewers!.should.not.contain(test_env.users[2].id)
                                break;
                            case 2:
                                story!.editors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 3:
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                story!.owner._id.toString().should.not.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            },
            {
                name: "viewer can not give any permissions to users",
                querier: 1,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // make user 1 a viewer
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { viewers: [test_env.users[1].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(200)
                    res.body.should.have.property('error')
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        story!.viewers!.should.contain(test_env.users[1].id)

                        switch (permissionLevel) {
                            case 1:
                                story!.viewers!.should.not.contain(test_env.users[2].id)
                                break;
                            case 2:
                                story!.editors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 3:
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                story!.owner._id.toString().should.not.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            },
            {
                name: "owner should be able to change all existing permissions",
                querier: 0,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // make user 2 an author
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { authors: [test_env.users[2].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(204)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        switch (permissionLevel) {
                            case 1:
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                story!.viewers!.should.contain(test_env.users[2].id)
                                break;
                            case 2:
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                story!.editors!.should.contain(test_env.users[2].id)
                                break;
                            case 3:
                                story!.authors!.should.contain(test_env.users[2].id)
                                break;
                            case 4:
                                // this is a change of ownership - prior owner should become an author
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                story!.owner._id.toString().should.equal(test_env.users[2].id)
                                story!.authors!.should.contain(test_env.users[0].id)
                                break;
                        }
                    })
                }
            },
            {
                name: "author should not be able to change the permissions of another author",
                querier: 1,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // make user 2 an author
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { authors: [test_env.users[1].id, test_env.users[2].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(200)
                    res.body.should.have.property('error')
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        story!.viewers!.should.not.contain(test_env.users[2].id)
                        story!.editors!.should.not.contain(test_env.users[2].id)
                        story!.authors!.should.contain(test_env.users[2].id)
                        story!.owner._id.toString().should.not.equal(test_env.users[2].id)
                    })
                }
            },
            {
                name: "author should not be able to change the permissions of an owner",
                querier: 1,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // make user 1 an author and 2 an owner
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { owner: test_env.users[2].id, authors: [test_env.users[1].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(200)
                    res.body.should.have.property('error')
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        story!.viewers!.should.not.contain(test_env.users[2].id)
                        story!.editors!.should.not.contain(test_env.users[2].id)
                        story!.authors!.should.not.contain(test_env.users[2].id)
                        story!.owner._id.toString().should.be.equal(test_env.users[2].id)
                    })
                }
            },
            {
                name: "author should be able to change the permissions of an editor", // we assume also a viewer
                querier: 1,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // make user 1 an author and 2 an editor
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { authors: [test_env.users[1].id], editors: [test_env.users[2].id]}, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        switch (permissionLevel) {
                            case 1:
                                res.should.have.status(204)
                                story!.editors!.should.not.contain(test_env.users[2].id)
                                story!.viewers!.should.contain(test_env.users[2].id)
                                break;
                            case 2:
                                res.should.have.status(204)
                                story!.editors!.should.contain(test_env.users[2].id)
                                break;
                            case 3:
                                res.should.have.status(200)
                                res.body.should.have.property('error')
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                res.should.have.status(200)
                                res.body.should.have.property('error')
                                story!.owner._id.toString().should.not.be.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            },
            {
                name: "editor should not be able to change any permissions",
                querier: 1,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // make both user 1 and 2 editors
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { editors: [test_env.users[1].id, test_env.users[2].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(200)
                    res.body.should.have.property('error')
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        switch (permissionLevel) {
                            case 1:
                                story!.viewers!.should.not.contain(test_env.users[2].id)
                                break;
                            case 2:
                                story!.editors!.should.contain(test_env.users[2].id)
                                break;
                            case 3:
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                story!.owner._id.toString().should.not.be.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            },
            {
                name: "viewer should not be able to change any permissions",
                querier: 1,
                prep: async (permissionLevel: number, test_env: any): Promise<void> => {
                    // mmake both user 1 and 2 viewers
                    await StoryModel.findByIdAndUpdate(test_env.storyId, { viewers: [test_env.users[1].id, test_env.users[2].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(200)
                    res.body.should.have.property('error')
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    await StoryModel.findById(test_env.storyId, (err, story) => {
                        if (err) {
                            console.error(err)
                        }
                        switch (permissionLevel) {
                            case 1:
                                story!.viewers!.should.contain(test_env.users[2].id)
                                break;
                            case 2:
                                story!.editors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 3:
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                story!.owner._id.toString().should.not.be.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            },
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

    describe("/DELETE story permission", () => {
        let test_env: any
        beforeEach(done => {
            // we set up three users, one is the owner, the next has the permission we are testing (the subject)
            // and the last is the permission we are most likely removing (the object)
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
                name: "allows viewer to remove themselves from a story",
                subjectsPermission: PermissionGroup.Viewer,
                removeObject: false, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.None, // noop as we are not removing the object 
                expResponse: null 
            },
            {
                name: "does not allow owner to remove themselves from the story",
                subjectsPermission: PermissionGroup.Owner,
                removeObject: false, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.None, // noop as we are not removing the object 
                expResponse: storyErrors.UserPermissionDenied
            },
            {
                name: "allows owner to remove an author from the story",
                subjectsPermission: PermissionGroup.Owner,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Author, // noop as we are not removing the object 
                expResponse: null
            },
            {
                name: "allows author to remove editor from the story",
                subjectsPermission: PermissionGroup.Author,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Editor, // noop as we are not removing the object 
                expResponse: null
            },
            {
                name: "does not allow author to remove another author",
                subjectsPermission: PermissionGroup.Author,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Author, // noop as we are not removing the object 
                expResponse: storyErrors.UserPermissionDenied
            },
            {
                name: "no one should be able to remove the owner",
                subjectsPermission: PermissionGroup.Author,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Owner, // noop as we are not removing the object 
                expResponse: storyErrors.UserPermissionDenied
            },
            {
                name: "does not allow editor to remove author",
                subjectsPermission: PermissionGroup.Editor,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Author, // noop as we are not removing the object 
                expResponse: storyErrors.UserPermissionDenied
            },
            {
                name: "does not allow editor to remove viewer",
                subjectsPermission: PermissionGroup.Editor,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Viewer, // noop as we are not removing the object 
                expResponse: storyErrors.UserPermissionDenied
            },
            {
                name: "does not allow viewer to remove author",
                subjectsPermission: PermissionGroup.Viewer,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Author, // noop as we are not removing the object 
                expResponse: storyErrors.UserPermissionDenied
            },
            {
                name: "does not allow viewer to remove viewer",
                subjectsPermission: PermissionGroup.Viewer,
                removeObject: true, // i.e. the subject is removing themselves 
                objectsPermission: PermissionGroup.Viewer, // noop as we are not removing the object 
                expResponse: storyErrors.UserPermissionDenied
            },
        ]

        testCases.forEach(test =>{
            it(test.name, done => {
                addUserPermission(test_env.users[1].id, test_env.storyId, test.subjectsPermission).then(() => { 
                    addUserPermission(test_env.users[2].id, test_env.storyId, test.objectsPermission).then(() => { 
                        let objectIndex = 1;
                        if (test.removeObject) {
                            objectIndex = 2; 
                        }
                        chai
                            .request(app)
                            .delete("/api/story/" + test_env.storyId + "/permissions")
                            .query({ token: test_env.users[1].token })
                            .send({ user: test_env.users[objectIndex].id })
                            .end((err, res) => {
                                if (err) {
                                    console.error(err)
                                }
                                if (test.expResponse) {
                                    res.should.have.status(200)
                                    res.body.should.have.property('error')
                                    res.body.error.should.equals(test.expResponse)
                                } else {
                                    res.should.have.status(204)
                                }
                                
                                checkUserIsNotPartOfStory(test_env.users[objectIndex].id, test_env.storyId)
                                    .then((deleted: boolean) => {
                                        if (test.expResponse) {
                                            deleted.should.be.false
                                        } else {
                                            deleted.should.be.true
                                        }
                                        done()
                                    });
                            });
                    })
                })
            });
        });

    });

    describe.only("/PUT story title", () => {
        let test_env: any
        beforeEach(done => {
            setupUsersAndTokens(["user1", "user2"])
                .then((res: any[]) => {
                    createStory("Test Story", res[0].token)
                        .then((id) => {
                            test_env = {
                                users: res,
                                storyId: id,
                                originalTitle: "Test Story", 
                                newTitle: "New Test Story"
                            }
                            done()
                        })
                })
                .catch((err) => {
                    console.log(err)
                });
        })

        // TODO we could simplify this even further but something to do in the future
        let testCases = [
            {
                name: "allows the owner to change the name of a story",
                permission:  PermissionGroup.Owner,
                error: null
            },
            {
                name: "allows an author to change the name of a story",
                permission:  PermissionGroup.Author,
                error: null
            },
            {
                name: "does not allow an editor to change the name of a story",
                permission:  PermissionGroup.Editor,
                error: storyErrors.UserPermissionDenied
            },
            {
                name: "does not allow a viewer to change the name of a story",
                permission:  PermissionGroup.Viewer,
                error: storyErrors.UserPermissionDenied
            },
            {
                name: "does not allow an unknown user to change the title of a story",
                permission:  PermissionGroup.None,
                error: storyErrors.UserPermissionDenied
            }
        ]
        
        testCases.forEach(test => {
            it(test.name, done => { 
                addUserPermission(test_env.users[1].id, test_env.storyId, test.permission)
                    .then(() => {
                        chai
                            .request(app)
                            .put("/api/story/" + test_env.storyId + "/title")
                            .query({ token: test_env.users[1].token })
                            .send({ title: test_env.newTitle })
                            .end((err, res) => {
                                if (err) {
                                    console.error(err)
                                }
                                if (test.error) {
                                    res.should.have.status(200)
                                    res.body.should.have.property('error')
                                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                                } else {
                                    res.should.have.status(204)
                                }
                                StoryModel.findById(test_env.storyId, (err, story) => {
                                    if (err) {console.error(err);}
                                    if (test.error) {
                                        story!.title.should.equals(test_env.originalTitle)
                                    } else {
                                        story!.title.should.equals(test_env.newTitle)
                                    }
                                    done()
                                })
                            });
                    })
            });
        });

    });
    
});

