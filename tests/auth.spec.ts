process.env.NODE_ENV = 'test';
import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { UserModel } from "../models/user"
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { expect } from "chai"

chai.use(chaiHttp);
describe("Authentication", () => {
  let user = { 
    email: "test@example.com",
    password: "test"
  }

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
          res.body.should.have.property("token")
          // make sure the password is correctly hashed
          argon2.verify(res.body.user.password, user.password).then((valid: boolean) => {
            expect(valid).to.be.true
            done();
          })
        });
      });

      // eventually we need tests to make sure emails and passwords follow the rules behind them
      var runs = [
        { 
          test: "should not allow empty emails", 
          user: { 
            password: "test" 
          },
          assertions: (res: any) => {
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.error.should.equals("Missing credentials")
          }
        },
        { 
          test: "should not allow empty password",
          user: { email: "test3@example.com" },
          assertions: (res: any) => {
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.error.should.equals("Missing credentials")
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
            res.body.error.should.equals("User already exists")
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

    describe("/POST login", () => {
      it("returns a token for correct requests", done => {
        chai
          .request(app)
          .post("/auth/login")
          .send(user)
          .end((err, res) => {
            res.should.have.status(200)
            res.body.should.have.property("token")
            res.body.token.should.have.length(197)
            // check that the user is logged in
            chai
              .request(app)
              .get("/api/me")
              .query({token: res.body.token})
              .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property("user")
                res.body.user.should.have.property("email")
                res.body.user.email.should.equals(user.email)
              })
            done()
          })
      });

      let invalidRuns = [
        {
          test: "should not allow users that are not in the database",
          user: { 
            email: "test3@example.com",
            password: "test3"
          },
          assertions: (res: any) => {
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.should.not.have.property("token")
            res.body.error.should.equals("User not found")
          }
        }, 
        {
          test: "should not allow a user that has entered an incorrect password",
          user: { 
            email: "test@example.com",
            password: "test3"
          },
          assertions: (res: any) => {
            res.should.have.status(200)
            res.body.should.have.property("error")
            res.body.should.not.have.property("token")
            res.body.error.should.equals("Incorrect Password")
          }, 
        }
      ];

      invalidRuns.forEach(run => {
        it(run.test, done => {
          chai
            .request(app)
            .post("/auth/login")
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

    describe("Access without valid token", () => {
      let invalidToken = randomBytes(100)
      it("should not show a profile", (done) => {
        chai
            .request(app)
            .get("/api/user")
            .query({token: invalidToken})
            .end((err, res) => {
                if (err) {
                    console.log(err)
                }
                res.should.have.status(401)
                done()
            })
      })

      // Note: I think we will want users to be able to create stories but they will need to login
      // in order to save them
      it("should not be able to create a story", (done) => { 
        chai
            .request(app)
            .post("/api/story")
            .send({title: "Test Story"})
            .query({token: invalidToken})
            .end((err, res) => {
                if (err) {
                    console.log(err)
                }
                res.should.have.status(401)
                done()
            })
      })
    })
});

// TODO: test logging out and make sure it destroys the token so the user can't use it any more