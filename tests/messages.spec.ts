process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
import * as argon2 from "argon2";
import { UserModel } from "../models/user"
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { expect } from "chai"

chai.use(chaiHttp);
describe("Messages", () => {
    it("passes the sanity check", done => {
        chai
        .request(app)
        .get("/test")
        .end((err, res) => {
            res.should.have.status(200);
            res.body.message.should.equals("test successful");
            done();
        });
    });
});