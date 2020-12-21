import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { setupUsersAndSession, 
    clearUsers, 
    clearStoriesAndCards, 
    createStory, 
    checkUserIsNotPartOfStory, 
    addUserPermission, 
    SessionEnv, 
    TestEnv} from "./test_utils"
import { errors } from "../routes/errors";
import { UserModel } from "../models/user";
import { Story, StoryModel } from "../models/story";
import { PermissionGroup, permissionString } from "../services/permissions";
import { Test } from "mocha";

let should = chai.should();
let expect = chai.expect;

chai.use(chaiHttp);
// NOTE: all tests within each describe are dependent on one another 
describe("Story", () => {
    afterEach((done) => {
        clearUsers()
        clearStoriesAndCards()
        done()
    })

    describe("/POST story", () => {
        let test_env: SessionEnv
        beforeEach((done) => {
            setupUsersAndSession(1)
                .then((resp: SessionEnv) => {
                    test_env = resp
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
                .set("cookie", test_env.cookie)
                .send(story)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.have.property("story")
                    res.body.should.have.property("rootCard")
                    res.body.story.should.have.property("description")
                    res.body.story.should.have.property("title")
                    res.body.story.should.have.property("owner")
                    res.body.story.should.have.property("_id")
                    res.body.story.title.should.equals(story.title)
                    res.body.story.description.should.equals(story.description)
                    res.body.story.owner.should.equals(test_env.users[0].id)
                    let storyId = res.body.story._id
                    res.body.rootCard.story.should.equals(storyId)
                    chai
                        .request(app)
                        .get("/api/story")
                        .set("cookie", test_env.cookie)
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
                .set("cookie", test_env.cookie)
                .send({ message: "Hello" })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property("error")
                    res.body.error.should.equals(errors.MissingTitle);
                    // when we request all stories we should just have the original one
                    chai
                        .request(app)
                        .get("/api/story")
                        .set("cookie", test_env.cookie)
                        .end((err, res) => {
                            res.should.have.status(200)
                            res.body.should.have.length(0)
                            done();
                        });

                });
        })

    })

    describe("/GET story", () => {
        let test_env: SessionEnv
        beforeEach((done) => {
            setupUsersAndSession(2)
                .then((resp: SessionEnv) => {
                    test_env = resp
                    done()
                })
                .catch((err: any) => {
                    console.error(err);
                })
        })

        it("can retrieve existing stories", done => {
            createStory(test_env.users[0]).then((resp: any) => {
                chai
                    .request(app)
                    .get("/api/story/" + resp.story._id)
                    .set("cookie", test_env.cookie)
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
                .set("cookie", test_env.cookie)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.have.property("error")
                    res.body.error.should.equals(errors.StoryNotFound)
                    done();
                })
        })

        it("doesn't allow access to accounts that do not have permission", done => {
            createStory(test_env.users[1]).then((story: Story) => {
                chai
                    .request(app)
                    .get("/api/story/" + story._id)
                    .set("cookie", test_env.cookie)
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.empty
                        done()
                    })
            });
        })
    })

    describe("/GET last story", () => {
        let test_env: any
        beforeEach((done) => {
            setupUsersAndSession(1)
                .then((resp: SessionEnv) => {
                    createStory(resp.users[0]).then((story: any) => {
                        test_env = {
                            user: resp.users[0],
                            story: story
                        }
                        done()
                    })
                })
                .catch((err: any) => {
                    console.error(err);
                })
        })

        it("gets the last story the user was on", done => {
            chai
                .request(app)
                .get("/api/story/last")
                .set("cookie", test_env.cookie)
                .end((err, res) => {
                    console.log(res)
                    res.should.have.status(200)
                    res.body.should.have.property("_id")
                    res.body._id.should.equal(test_env.story.id)
                    UserModel.findById(test_env.user.id, (err, user) => {
                        if (err) { console.error(err); }
                        expect(user).to.not.be.null
                        user!.lastStory.should.equals(test_env.story._id)
                        done()
                    })
                });
        })
    })

    describe("/DELETE story", () => {
        let test_env: TestEnv
        beforeEach(done => {
            setupUsersAndSession(2).then((resp: SessionEnv) => {
                createStory(resp.users[0]).then((story: Story) => {
                    test_env = {
                        users: resp.users,
                        cookie: resp.cookie,
                        story: story, 
                        cards: [],
                    }
                    done()
                });
            });
        });

        it("should not allow unauthorized users to delete a story", done => {
            createStory(test_env.users[1], "Other Story").then((story: Story) => {
                chai
                    .request(app)
                    .delete("/api/story/" + story._id)
                    .query({ token: test_env.cookie })
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.empty
                        // authorized user should still have access to the story
                        StoryModel.find(story._id, (err, story) => {
                            expect(err).to.be.null
                            expect(story).to.not.be.null
                        })
                    });
            }).catch(err => {console.error(err)})
        })

        it("should not allow non-users to delete a story", done => {
            chai
                .request(app)
                .delete("/api/story/" + test_env.story._id)
                .set( "cookie", "invalid cookie" )
                .end((err, res) => {
                    res.should.have.status(401)
                    // authorized user should still have access to the 
                    StoryModel.find(test_env.story._id, (err, story) => {
                        expect(err).to.be.null
                        expect(story).to.not.be.null
                    })
                });
        })

        it("can delete stories", done => {
            chai
                .request(app)
                .delete("/api/story/" + test_env.story._id)
                .set("cookie", test_env.cookie)
                .end((err, res) => {
                    res.should.have.status(204)
                    res.body.should.be.empty
                    chai
                        .request(app)
                        .get("/api/story/" + test_env.story._id)
                        .set("cookie", test_env.cookie)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property("error")
                            res.body.error.should.equals(errors.StoryNotFound);
                            done()
                        });
                })
        })
    })

    describe("/POST story permission", () => {
        let test_env: TestEnv
        beforeEach(done => {
            // we set up three users, the first is the one making the request (the cookie belongs to that owner), 
            // the second is the owner/creator, and the last is the permission we are adjusting / adding
            setupUsersAndSession(3)
                .then((res: SessionEnv) => {
                    createStory(res.users[1]) // 1 is always owner
                        .then((story: Story) => {
                            test_env = {
                                users: res.users,
                                cookie: res.cookie,
                                story: story,
                                cards: [],
                            }
                            done()
                        })
                        .catch((err => console.error(err)))
                })
                .catch((err) => {
                    console.error(err)
                });
        })

        let testCases = [
            {
                name: "owner can give all permissions to users",
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make user 1 the owner
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { owner: test_env.users[0]._id }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(201)
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
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make user 1 an author
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { authors: [test_env.users[0]._id] }, (err, result) => {
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
                                res.should.have.status(201)
                                story!.viewers!.should.contain(test_env.users[2].id)
                                break;
                            case 2:
                                res.should.have.status(201)
                                story!.editors!.should.contain(test_env.users[2].id)
                                break;
                            case 3:
                                res.should.have.status(401)
                                res.body.should.be.empty
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                res.should.have.status(401)
                                res.body.should.be.empty
                                story!.owner._id.toString().should.not.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            },
            {
                name: "editor can not give any permissions to users",
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make user 1 an editor
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { editors: [test_env.users[0].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(401)
                    res.body.should.be.empty
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
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make user 1 a viewer
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { viewers: [test_env.users[0].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(401)
                    res.body.should.be.empty
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
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make user 1 the owner and user 3 an author
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { owner: test_env.users[0].id, authors: [test_env.users[2].id] }, (err, result) => {
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
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make both user 1 and 3 an author 
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { authors: [test_env.users[0].id, test_env.users[2].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(401)
                    res.body.should.be.empty
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
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make user 1 an author and 3 an owner
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { owner: test_env.users[2].id, authors: [test_env.users[0].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(401)
                    res.body.should.be.empty
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
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make user 1 an author and 3 an editor
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { authors: [test_env.users[0].id], editors: [test_env.users[2].id] }, (err, result) => {
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
                                res.should.have.status(401)
                                res.body.should.be.empty
                                story!.authors!.should.not.contain(test_env.users[2].id)
                                break;
                            case 4:
                                res.should.have.status(401)
                                res.body.should.be.empty
                                story!.owner._id.toString().should.not.be.equal(test_env.users[2].id)
                                break;
                        }
                    })
                }
            },
            {
                name: "editor should not be able to change any permissions",
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make both user 1 and 3 editors
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { editors: [test_env.users[0].id, test_env.users[2].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(401)
                    res.body.should.be.empty
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
                prep: async (test_env: TestEnv): Promise<void> => {
                    // make both user 1 and 2 viewers
                    await StoryModel.findByIdAndUpdate(test_env.story._id, { viewers: [test_env.users[0].id, test_env.users[2].id] }, (err, result) => {
                        if (err) { console.error(err); }
                    });
                    return
                },
                assertions: async (res: any, permissionLevel: number, test_env: any) => {
                    res.should.have.status(401)
                    res.body.should.be.empty
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
                    test.prep(test_env).then(() => {
                        chai
                            .request(app)
                            .post("/api/story/" + test_env.story._id + "/permissions")
                            .set("cookie", test_env.cookie)
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
        let test_env: TestEnv;
        beforeEach(done => {
            // we set up three users, the first is the one making the request (the cookie belongs to that owner), 
            // the second is the owner/creator, and the last is the user whoms permission we are deleting
            setupUsersAndSession(3)
                .then((res: SessionEnv) => {
                    createStory(res.users[1]) // 2 is always owner
                        .then((story: Story) => {
                            test_env = {
                                users: res.users,
                                cookie: res.cookie,
                                story: story, 
                                cards: [],
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
                removeObject: false,
                objectsPermission: PermissionGroup.None,
                allowed: true
            },
            {
                name: "does not allow owner to remove themselves from the story",
                subjectsPermission: PermissionGroup.Owner,
                removeObject: false,
                objectsPermission: PermissionGroup.None,
                allowed: false
            },
            {
                name: "allows owner to remove an author from the story",
                subjectsPermission: PermissionGroup.Owner,
                removeObject: true,
                objectsPermission: PermissionGroup.Author,
                allowed: true
            },
            {
                name: "allows author to remove editor from the story",
                subjectsPermission: PermissionGroup.Author,
                removeObject: true,
                objectsPermission: PermissionGroup.Editor,
                allowed: true
            },
            {
                name: "does not allow author to remove another author",
                subjectsPermission: PermissionGroup.Author,
                removeObject: true,
                objectsPermission: PermissionGroup.Author,
                allowed: false
            },
            {
                name: "no one should be able to remove the owner",
                subjectsPermission: PermissionGroup.Author,
                removeObject: true,
                objectsPermission: PermissionGroup.Owner,
                allowed: false
            },
            {
                name: "does not allow editor to remove author",
                subjectsPermission: PermissionGroup.Editor,
                removeObject: true,
                objectsPermission: PermissionGroup.Author,
                allowed: false
            },
            {
                name: "does not allow editor to remove viewer",
                subjectsPermission: PermissionGroup.Editor,
                removeObject: true,
                objectsPermission: PermissionGroup.Viewer,
                allowed: false
            },
            {
                name: "does not allow viewer to remove author",
                subjectsPermission: PermissionGroup.Viewer,
                removeObject: true,
                objectsPermission: PermissionGroup.Author,
                allowed: false
            },
            {
                name: "does not allow viewer to remove viewer",
                subjectsPermission: PermissionGroup.Viewer,
                removeObject: true,
                objectsPermission: PermissionGroup.Viewer,
                allowed: false
            },
        ]

        testCases.forEach(test => {
            it(test.name, done => {
                addUserPermission(test_env.users[0].id, test_env.story._id, test.subjectsPermission).then(() => {
                    addUserPermission(test_env.users[2].id, test_env.story._id, test.objectsPermission).then(() => {
                        let objectIndex = 1;
                        if (test.removeObject) {
                            objectIndex = 2;
                        }
                        chai
                            .request(app)
                            .delete("/api/story/" + test_env.story._id + "/permissions")
                            .set("cookie", test_env.cookie)
                            .send({ user: test_env.users[objectIndex].id })
                            .end((err, res) => {
                                if (err) {
                                    console.error(err)
                                }
                                if (test.allowed) {
                                    res.should.have.status(204)
                                } else {
                                    res.should.have.status(401)
                                    res.body.should.be.empty
                                }

                                checkUserIsNotPartOfStory(test_env.users[objectIndex].id, test_env.story._id)
                                    .then((deleted: boolean) => {
                                        if (test.allowed) {
                                            deleted.should.be.true
                                        } else {
                                            deleted.should.be.false
                                        }
                                        done()
                                    });
                            });
                    })
                })
            });
        });

    });

    describe("/PUT modify story meta data", () => {
        let test_env: any
        beforeEach(done => {
            setupUsersAndSession(2)
                .then((res: SessionEnv) => {
                    createStory(res.users[1])
                        .then((story: Story) => {
                            test_env = {
                                users: res.users,
                                cookie: res.cookie,
                                storyId: story._id,
                                originalTitle: "Test Story",
                                newTitle: "New Test Story",
                                newDescription: "this is a test description"
                            }
                            done()
                        })
                })
                .catch((err) => {
                    console.log(err)
                });
        })

        let expErrors = [true, true, true, false, false]

        expErrors.forEach((expError: boolean, index: number) => {
            let name = "allows user of permission " + permissionString[index] + " to change the title of a story"
            if (expError) {
                name = "does not allow user of permission " + permissionString[index] + " to change the title of a story"
            }
            it(name, done => {
                addUserPermission(test_env.users[0].id, test_env.storyId, index)
                    .then(() => {
                        chai
                            .request(app)
                            .put("/api/story/" + test_env.storyId)
                            .set("cookie", test_env.cookie)
                            .send({ title: test_env.newTitle })
                            .end((err, res) => {
                                if (err) {
                                    console.error(err)
                                }
                                if (expError) {
                                    res.should.have.status(401)
                                    res.body.should.be.empty
                                } else {
                                    res.should.have.status(204)
                                }
                                StoryModel.findById(test_env.storyId, (err, story) => {
                                    if (err) { console.error(err); }
                                    if (expError) {
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

        expErrors.forEach((expError: boolean, index: number) => {
            let name = "allows user of permission " + permissionString[index] + " to change the description of a story"
            if (expError) {
                name = "does not allow user of permission " + permissionString[index] + " to change the description of a story"
            }
            it(name, done => {
                addUserPermission(test_env.users[0].id, test_env.storyId, index)
                    .then(() => {
                        chai
                            .request(app)
                            .put("/api/story/" + test_env.storyId)
                            .set("cookie", test_env.cookie)
                            .send({ description: test_env.newDescription })
                            .end((err, res) => {
                                if (err) {
                                    console.error(err)
                                }
                                if (expError) {
                                    res.should.have.status(401)
                                    res.body.should.be.empty
                                } else {
                                    res.should.have.status(204)
                                }
                                StoryModel.findById(test_env.storyId, (err, story) => {
                                    if (err) { console.error(err); }
                                    if (expError) {
                                        expect(story!.description).to.be.undefined
                                    } else {
                                        story!.description!.should.equals(test_env.newDescription)
                                    }
                                    done()
                                })
                            });
                    })
            });
        });

    });
});

