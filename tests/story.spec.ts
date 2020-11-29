process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { expect } from "chai"
import { setupUserAndToken, clearUsers, clearStoriesAndCards } from "./test_utils"

chai.use(chaiHttp);
// NOTE: all tests within the describe are dependent on one another 
describe("Story", () => {
    let token = ""
    before((done) => {
        clearUsers()
        clearStoriesAndCards()
        setupUserAndToken("first_user").then((value: string) => {
            token = value
            done()
        })
    })
    // token.should.not.equals("")
    let storyId: string = ""
    
    it("can create stories", done => {
        let story = { 
            title: "Test Story"
        }
        chai
            .request(app)
            .post("/api/story")
            .query({token: token})
            .send(story)
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.have.property("message")
                res.body.should.have.property("story")
                res.body.message.should.equals("success. Test Story created.");
                res.body.story.title.should.equals("Test Story")
                storyId = res.body.story._id
                chai
                    .request(app)
                    .get("/api/stories")
                    .query({token: token})
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property("stories")
                        res.body.stories.should.have.length(1)
                        console.log(res.body.stories)
                        expect(res.body.stories[0]._id).to.equal(storyId)
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
                res.should.have.status(200);
                res.body.should.have.property("error")
                res.body.message.should.equals("empty title");
                // when we request all stories we should just have the original one
                chai
                    .request(app)
                    .get("/api/stories")
                    .query({token: token})
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property("stories")
                        res.body.stories.should.have.length(1)
                        done();
                    });
                
            });
    })

    // it("can retrieve existing stories", done => {

    // })
    console.log(storyId);

    
});

