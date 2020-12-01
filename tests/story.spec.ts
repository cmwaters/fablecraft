process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { setupUserAndToken, clearUsers, clearStoriesAndCards } from "./test_utils"
import { storyErrors } from "../routes/errors";

chai.use(chaiHttp);
// NOTE: all tests within the describe are dependent on one another 
describe.only("Story", () => {
    let token = ""
    before((done) => {
        clearUsers()
        clearStoriesAndCards()
        setupUserAndToken("first_user").then((value: string) => {
            token = value
            done()
        })
    })
    let storyId: string = ""
    
    it("can create stories", done => {
        let story = { 
            title: "Test Story",
            description: "A story about tests"
        }
        chai
            .request(app)
            .post("/api/story")
            .query({token: token})
            .send(story)
            .end((err, res) => {
                console.log(res.body)
                res.should.have.status(201);
                res.body.should.have.property("title")
                res.body.title.should.equals(story.title)
                res.body.should.have.property("description")
                res.body.description.should.equals(story.description)
                res.body.should.have.property("_id")
                storyId = res.body._id
                chai
                    .request(app)
                    .get("/api/story")
                    .query({token: token})
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
            .query({token: token})
            .send({message: "Hello"})
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property("error")
                res.body.error.should.equals("empty title");
                // when we request all stories we should just have the original one
                chai
                    .request(app)
                    .get("/api/story")
                    .query({token: token})
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.length(1)
                        done();
                    });
                
            });
    })

    it("can retrieve existing stories", done => {
        chai
            .request(app)
            .get("/api/story/" + storyId)
            .query({ token: token })
            .end((err, res) => {
                console.log(res.body)
                res.should.have.status(200);
                res.body.should.have.property("title")
                res.body.title.should.equals("Test Story");
                done()
            });
    })

    it("errors when it doesn't have the story", done => {
        chai
            .request(app)
            .get("/api/story/5fc6a36c86e19483774f3ff7")
            .query({token: token})
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property("error")
                res.body.error.should.equals(storyErrors.StoryNotFound)
                done();
            })
    })

    it("doesn't allow access to accounts that do not have permission", done => {
        setupUserAndToken("second_user").then((secondToken: string) => {
            chai
                .request(app)
                .get("/api/story/" + storyId)
                .query({token: secondToken})
                .end((err, res) => {
                    console.log(res.body)
                    res.should.have.status(200)
                    res.body.should.have.property("error")
                    res.body.error.should.equals(storyErrors.UserPermissionDenied)
                    done()
                })
        })
    })
    
});

