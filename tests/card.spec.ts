import chai from "chai";
import chaiHttp from "chai-http";
import * as dotenv from "dotenv";
import {
    setupUsersAndSession,
    clearUsers,
    clearStoriesAndCards,
    createStory,
    addUserPermission,
    createCardColumn,
    SessionEnv,
    TestEnv,
} from "./test_utils";
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` });
import { app } from "../index";
import { expect } from "chai";
import { Story } from '../models/header'
import { Card, CardModel } from "../models/card";
import { permissionString } from "../services/permissions";
import { errors } from "../services/errors";

const defaultCardText = "default test card text";

chai.use(chaiHttp);
describe("Card", () => {
    let test_env: TestEnv;

    before((done) => {
        clearUsers();
        clearStoriesAndCards();
        done();
    });

    afterEach((done) => {
        clearUsers();
        clearStoriesAndCards();
        done();
    });

    beforeEach((done) => {
        // each test is set up with two users and a single story with two cards
        setupUsersAndSession(2).then((resp: SessionEnv) => {
            createStory(resp.users[1]).then((story: Story) => {
                createCardColumn(story._id, 2).then((cards: Card[]) => {
                    test_env = {
                        users: resp.users,
                        cookie: resp.cookie,
                        story: story,
                        cards: cards,
                    };
                    done()
                }).catch((err) => {console.error(err)})
            })
            .catch(err => console.error(err))
        })
        .catch(err => console.error(err))
    });

    describe("/GET all cards", () => {
        let testResults = [true, true, true, true, false];

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not return all the story's cards";
            if (success) {
                name = permissionString[4 - index] + " should return all the story's cards";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    chai.request(app)
                        .get("/api/cards/")
                        .set("cookie", test_env.cookie)
                        .send({ story: test_env.story })
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(200);
                                res.body.should.have.property("cards");
                                res.body.cards.should.have.length(2);
                            } else {
                                res.should.have.status(401);
                                res.body.should.be.empty
                            }
                            done();
                        });
                }).catch((err) => console.error(err));
                
            });
        });
    });

    // this is a limited test because we don't check to see if the card would pair with a card
    // above it and with a parent if it had it (only that it pairs with the card below).
    // We can test these later with fuzzy testing
    describe("/POST create card above", () => {
        let testResults = [true, true, false, false, false];

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not be able to create a card above";
            if (success) {
                name = permissionString[4 - index] + " should be able to create a card above";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    chai.request(app)
                        .post("/api/card/above")
                        .set("cookie", test_env.cookie)
                        .send({ story: test_env.story, sibling: test_env.cards[1]._id, text: defaultCardText })
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(201);
                                res.body.should.have.property("card");
                                // we just want the output to be the id, not the entire story
                                res.body.card.should.have.property("story");
                                res.body.card.story.should.equal(test_env.story._id.toString());
                                res.body.card.text.should.equal(defaultCardText);
                            } else {
                                res.should.have.status(401);
                                res.body.should.be.empty 
                            }
                            CardModel.find({ story: test_env.story }, (err, cards) => {
                                if (success) {
                                    expect(cards).to.have.length(3);
                                    cards[0].identifier.should.equal(0);
                                    cards[1].identifier.should.equal(1);
                                    cards[2].identifier.should.equal(2);
                                    cards[0].below!._id.toString().should.equal(cards[1].id);
                                    cards[1].above!._id.toString().should.equal(cards[0].id);
                                    cards[1].below!._id.toString().should.equal(cards[2].id);
                                    cards[2].above!._id.toString().should.equal(cards[1].id);
                                } else {
                                    expect(cards).to.have.length(2);
                                }
                                done();
                            });
                        });
                }).catch(err => { console.error(err);})
            });
        });
    });

    describe("/POST create card below", () => {
        let testResults = [true, true, false, false, false];

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not be able to create a card below";
            if (success) {
                name = permissionString[4 - index] + " should be able to create a card below";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    chai.request(app)
                        .post("/api/card/below")
                        .set("cookie", test_env.cookie)
                        .send({ story: test_env.story, sibling: test_env.cards[0]._id, text: defaultCardText })
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(201);
                                res.body.should.have.property("card");
                                // we just want the output to be the id, not the entire story
                                res.body.card.should.have.property("story");
                                res.body.card.story.should.equal(test_env.story._id.toString());
                                res.body.card.text.should.equal(defaultCardText);
                            } else {
                                res.should.have.status(401);
                                res.body.should.be.empty 
                            }
                            CardModel.find({ story: test_env.story }, (err, cards) => {
                                if (success) {
                                    expect(cards).to.have.length(3);
                                    cards[0].identifier.should.equal(0);
                                    cards[1].identifier.should.equal(1);
                                    cards[2].identifier.should.equal(2);
                                    cards[0].below!._id.toString().should.equal(cards[1].id);
                                    cards[1].above!._id.toString().should.equal(cards[0].id);
                                    cards[1].below!._id.toString().should.equal(cards[2].id);
                                    cards[2].above!._id.toString().should.equal(cards[1].id);
                                } else {
                                    expect(cards).to.have.length(2);
                                }
                                done();
                            });
                        });
                }).catch((err) => console.error(err));
            });
        });
    });

    describe("/POST create child card", () => {
        let testResults = [true, true, false, false, false];

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not be able to create a child card";
            if (success) {
                name = permissionString[4 - index] + " should be able to create a child card";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    chai.request(app)
                        .post("/api/card/child")
                        .set("cookie", test_env.cookie)
                        .send({ story: test_env.story, parent: test_env.cards[0], text: defaultCardText })
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(201);
                                res.body.should.have.property("card");
                                // we just want the output to be the id, not the entire story
                                res.body.card.should.have.property("story");
                                res.body.card.story.should.equal(test_env.story._id.toString());
                                res.body.card.text.should.equal(defaultCardText);
                            } else {
                                res.should.have.status(401);
                                res.body.should.be.empty 
                            }
                            CardModel.find({ story: test_env.story }, (err, cards) => {
                                if (success) {
                                    expect(cards).to.have.length(3);
                                    cards[0].identifier.should.equal(0);
                                    cards[0].depth.should.equal(0);
                                    cards[1].identifier.should.equal(1);
                                    cards[1].depth.should.equal(0);
                                    cards[2].identifier.should.equal(0);
                                    cards[2].depth.should.equal(1);
                                    cards[0].children![0]._id.toString().should.equal(cards[2].id);
                                    cards[2].parent!._id.toString().should.equal(cards[0].id);
                                } else {
                                    expect(cards).to.have.length(2);
                                }
                                // we make the same request again. This time it is too a card with existing children
                                // so it should append to the end
                                chai.request(app)
                                    .post("/api/card/child")
                                    .set("cookie", test_env.cookie)
                                    .send({ story: test_env.story, parent: test_env.cards[0], text: defaultCardText })
                                    .end((err, res) => {
                                        if (success) {
                                            res.should.have.status(201);
                                            res.body.should.have.property("card");
                                            // we just want the output to be the id, not the entire story
                                            res.body.card.should.have.property("story");
                                            res.body.card.story.should.equal(test_env.story._id.toString());
                                            res.body.card.text.should.equal(defaultCardText);
                                        } else {
                                            res.should.have.status(401);
                                            res.body.should.be.empty 
                                        }
                                        CardModel.find({ story: test_env.story }, (err, cards) => {
                                            if (success) {
                                                expect(cards).to.have.length(4);
                                                // check that the index and depths are correct
                                                cards[0].identifier.should.equal(0);
                                                cards[0].depth.should.equal(0);
                                                cards[1].identifier.should.equal(1);
                                                cards[1].depth.should.equal(0);
                                                cards[2].identifier.should.equal(0);
                                                cards[2].depth.should.equal(1);
                                                cards[3].identifier.should.equal(1);
                                                cards[3].depth.should.equal(1);
                                                // check that the ancestry is correct
                                                cards[0].children![0]._id.toString().should.equal(cards[2].id);
                                                cards[0].children![1]._id.toString().should.equal(cards[3].id);
                                                cards[2].parent!._id.toString().should.equal(cards[0].id);
                                                cards[3].parent!._id.toString().should.equal(cards[0].id);
                                                // check that the relations are correct
                                                cards[2].below!._id.toString().should.equal(cards[3].id);
                                                cards[3].above!._id.toString().should.equal(cards[2].id);
                                            } else {
                                                expect(cards).to.have.length(2);
                                            }
                                            done();
                                        });
                                    });
                            });
                        });
                }).catch((err) => console.error(err))
            });
        });
    });

    describe("/PUT update card text", () => {
        let testResults = [true, true, false, false, false];
        let newText = "Different Card Text"

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not be able to modify a card";
            if (success) {
                name = permissionString[4 - index] + " should be able to modify a card";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    chai.request(app)
                        .put("/api/card/" + test_env.cards[0]._id)
                        .set("cookie", test_env.cookie)
                        .send({ text: newText })
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(204);
                            } else {
                                res.should.have.status(401);
                            }
                            res.body.should.be.empty
                            CardModel.findById(test_env.cards[0]._id, (err, card) => {
                                if (success) {
                                    card!.text.should.equal(newText);
                                } else {
                                    card!.text.should.equal(defaultCardText);
                                }
                                done();
                            });
                        });
                }).catch((err) => { console.error(err)})
            });
        });
    });

    describe("/DELETE remove card", () => {
        let testResults = [true, true, false, false, false];

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not be able to delete a card";
            if (success) {
                name = permissionString[4 - index] + " should be able to delete a card";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    // once we've created a card we are going to delete the root card
                    chai.request(app)
                        .delete("/api/card/" + test_env.cards[0]._id)
                        .set("cookie", test_env.cookie)
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(204);
                                res.body.should.be.empty;
                            } else {
                                res.should.have.status(401);
                            }
                            CardModel.find({ story: test_env.story }, (err, cards) => {
                                if (success) {
                                    cards.should.have.length(1)
                                } else {
                                    cards.should.have.length(2)
                                }
                                // npw we delete the last remaining card which should result in an error
                                chai.request(app)
                                    .delete("/api/card/" + test_env.cards[1]._id)
                                    .set("cookie", test_env.cookie)
                                    .end((err, res) => {
                                        if (success) {
                                            res.should.have.status(200);
                                            res.body.should.have.property("error")
                                            res.body.error.should.equal(errors.DeletingFinalRootCard)
                                        } else {
                                            res.should.have.status(401)
                                            res.body.should.be.empty
                                        }
                                        CardModel.find({ story: test_env.story }, (err, cards) => {
                                            // nothing should have happened
                                            if (success) {
                                                cards.should.have.length(1)
                                            } else {
                                                cards.should.have.length(2)
                                            }
                                            done();
                                        });
                                    });
                            });
                        });
                }).catch((err) => {console.error(err)})
            });
        });
    });

    describe("/PUT move cards up and down", () => {
        let testResults = [true, true, false, false, false];

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not be able to move the card upwards";
            if (success) {
                name = permissionString[4 - index] + " should be able to move the card upwards";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    // once we've created a card we are going to move the root card up
                    chai.request(app)
                        .put("/api/card/" + test_env.cards[1]._id + "/move-up")
                        .set("cookie", test_env.cookie)
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(204);
                            } else {
                                res.should.have.status(401);
                            }
                            res.body.should.be.empty;
                            CardModel.find({ story: test_env.story }, (err, cards) => {
                                if (success) {
                                    // these two cards should have swapped
                                    cards[0].above!._id.toString().should.equal(cards[1].id)
                                    cards[1].below!._id.toString().should.equal(cards[0].id)
                                    expect(cards[1].above).to.be.undefined
                                    expect(cards[0].below).to.be.undefined
                                } else {
                                    cards[1].above!._id.toString().should.equal(cards[0].id)
                                    cards[0].below!._id.toString().should.equal(cards[1].id)
                                    expect(cards[0].above).to.be.undefined
                                    expect(cards[1].below).to.be.undefined
                                }
                                // now try to move the top card higher -> we should get an error
                                chai.request(app)
                                    .put("/api/card/" + test_env.cards[1]._id + "/move-up")
                                    .set("cookie", test_env.cookie)
                                    .end((err, res) => {
                                        if (success) {
                                            res.should.have.status(200);
                                            res.body.should.have.property("error")
                                            res.body.error.should.equal(errors.UpperCardBound)
                                        } else {
                                            res.should.have.status(401)
                                            res.body.should.be.empty;
                                        }
                                        CardModel.find({ story: test_env.story }, (err, cards) => {
                                            // nothing should have happened
                                            if (success) {
                                                // these two cards should have swapped
                                                cards[0].above!._id.toString().should.equal(cards[1].id)
                                                cards[1].below!._id.toString().should.equal(cards[0].id)
                                                expect(cards[1].above).to.be.undefined
                                                expect(cards[0].below).to.be.undefined
                                            } else {
                                                cards[1].above!._id.toString().should.equal(cards[0].id)
                                                cards[0].below!._id.toString().should.equal(cards[1].id)
                                                expect(cards[0].above).to.be.undefined
                                                expect(cards[1].below).to.be.undefined
                                            }
                                            done();
                                        });
                                    });
                            });
                        });
                }).catch((err) => {console.error(err)})
            });
        });
    })

    describe("/GET card", () => {
        let testResults = [true, true, true, true, false];

        testResults.forEach((success, index) => {
            let name = permissionString[4 - index] + " should not be able to modify a card";
            if (success) {
                name = permissionString[4 - index] + " should be able to modify a card";
            }
            it(name, (done) => {
                addUserPermission(test_env.users[0].id, test_env.story._id, 4 - index)
                .then(() => {
                    chai.request(app)
                        .get("/api/card/" + test_env.cards[0]._id)
                        .set("cookie", test_env.cookie)
                        .send({ text: defaultCardText })
                        .end((err, res) => {
                            if (success) {
                                res.should.have.status(200);
                                res.body.should.have.property("story")
                                res.body.story.should.equals(test_env.story._id.toString())
                                res.body.should.have.property("_id")
                            } else {
                                res.should.have.status(401);
                            }
                            done()
                        });
                }).catch(err => { console.error(err)})
            });
        });
    })
});
