process.env.NODE_ENV = 'test';
import { app } from "../index";
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
import { UserModel } from "../models/user"
let should = chai.should();
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

chai.use(chaiHttp);
describe("Authentication", () => {
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

describe("Authentication", () => {
  before((done) => {
    UserModel.deleteMany({}, (err) => {
      done();
    })
  })
  describe("/POST signup", () => {
    it("creates a user account", done => {
      let user = { 
        email: "test@example.com",
        password: "test"
      }
      chai
        .request(app)
        .post("/auth/signup")
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message")
          res.body.message.should.equals("Signup successful") 
          done();
        });
      });
    });
});