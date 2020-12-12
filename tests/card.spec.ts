process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
import { setupUsersAndTokens, clearUsers, clearStoriesAndCards, createStory, checkUserIsNotPartOfStory, addUserPermission } from "./test_utils"
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { expect } from "chai"

chai.use(chaiHttp);
// describe("Card", () => {
//     let test_env: any

//     afterEach((done) => {
//         clearUsers()
//         clearStoriesAndCards()
//         done()
//     })

//     beforeEach(done => {
//         setupUsersAndTokens(["user"]).then((resp: any[]) => {
//             test_env = {
//                 user: resp[0],
//                 story: ""
//             }
//             createStory("Test Story", test_env.user.token).then((storyID: string) => {
//                 test_env.story = storyID
//                 done()
//             })
//         })
//     })

//     it("passes the sanity check", done => {
//         chai
//         .request(app)
//         .get("/api/123/card/")
//         .query({token: test_env.user.token})
//         .end((err, res) => {
//             console.log(res.body)
//             res.should.have.status(200);
//             res.body.message.should.equals("Hello World 123");
//             done();
//         });
//     });
// });