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
      if (err) {
        console.log(err)
      }
      done();
    })
  })
  after((done) => {
    UserModel.deleteMany({}, (err) => {
      if (err) {
        console.log(err)
      }
      done();
    })
  })
  describe("/POST signup", () => {
    it("creates a user account", done => {
      let user = { 
        email: "test@example.com",
        password: "test"
      }
      UserModel.find((err, users) => {
        if (err) {
          console.log(err)
        } else if (users.length !== 0) {
          console.log("users should be empty." + users)
        }
      })
      chai
        .request(app)
        .post("/auth/signup")
        .send(user)
        .end((err, res) => {
          if (err) {
            console.log(err)
          }
          res.should.have.status(200);
          res.body.should.have.property("message")
          res.body.message.should.equals("Signup successful") 
          res.body.should.have.property("user")
          res.body.user.email.should.equals(user.email)
          // make sure the password is correctly hashed
          argon2.verify(res.body.user.password, user.password).then((valid: boolean) => {
            expect(valid).to.be.true
            done();
          })
        });
      });

      var runs = [
        { 
          test: "should not allow empty emails", 
          user: { 
            password: "test" 
          },
          assertions: (res: any) => {
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.error.message.should.equals("Missing credentials")
          }
        },
        { 
          test: "should not allow empty password",
          user: { email: "test3@example.com" },
          assertions: (res: any) => {
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.error.message.should.equals("Missing credentials")
          }
        }, 
        { 
          test: "should not allow duplicate accounts",
          user: { 
            email: "test@example.com",
            password: "test"
          },
          assertions: (res: any) => {
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.error.message.should.equals("User already exists")
          }
        }
      ]

      runs.forEach(run => {
        it(run.test, done => {
          chai
            .request(app)
            .post("/auth/signup")
            .send(run.user)
            .end((err, res) => {
              if (err) {
                console.log(err)
              }
              run.assertions(res)
              done()
            });
    
        });
      });
    });

    
});