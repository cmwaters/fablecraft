process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
import * as argon2 from "argon2";
import { UserModel } from "../models/user"
import { Story } from "../models/story"
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { expect } from "chai"

chai.use(chaiHttp);
describe("Story", () => {
    let token = ""
    beforeAll((done) => {
        setupUserAndToken().then((value: string) => {
            if (value === "") {
                console.log("empty token")
            }
            token = value
            done()
        })
    })
    let storyId = null
    
    it("can create stories", done => {
        let story = { 
            title: "Test Story"
        }
        console.log(token)
        chai
            .request(app)
            .post("/api/story")
            .query({token: token})
            .send(story)
            .end((err, res) => {
                res.should.have.status(201);
                res.body.message.should.equals("success. Test Story created.");
                chai
                    .request(app)
                    .get("/api/stories")
                    .query({token: token})
                    .end((err, res) => {
                        // console.log(res)
                        res.should.have.status(200)
                        res.body.should.have.property("stories")
                        res.body.stories.should.have.length(1)
                        storyId = res.body.stories[0]._id
                        done();
                    })
                
            });
    });

    // TODO: Change title and description
    // it("allows the user to change the name and description of a story", done => {
    //     chai
    //         .request(app)
    //         .put("/api/story/" + storyId)
    //         .query({token: token})
    //         .send({})
    // });
});

async function setupUserAndToken(): Promise<string> {
    return new Promise( (resolve, reject) => {
        UserModel.deleteMany({}, (err) => {
            if (err) {
                reject(err);
            }
        })
        // using the same test framework for retrieving a valid token
        chai
            .request(app)
            .post("/auth/signup")
            .send({
                email: "test@example.com",
                password: "test"
            })
            .end((err, res) => {
                if (err) {
                    console.log(err)
                }
                resolve(res.body.token)
            })
    })
}