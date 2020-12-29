import chai from "chai"
import chaiHttp from "chai-http";
import * as dotenv from 'dotenv'
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user"
import { setupUsersAndSession, SessionEnv, TEST_PASSWORD } from "./test_utils";
let should = chai.should();
dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })
import { app } from "../index";
import { errors } from "../routes/errors"
import { expect } from "chai"

chai.use(chaiHttp);
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
        username: "test",
        email: "test@gmail.com",
        password: TEST_PASSWORD,
      }
      chai
        .request(app)
        .post("/auth/signup")
        .send(user)
        .end((err, res) => {
          if (err) {
            console.error(err)
          }
          console.log(res.body)
          res.should.have.status(201);
          // we should never return the users password
          res.body.should.not.have.property("password")
          res.body.should.have.property("username", user.username)
          res.body.should.have.property("email", user.email)
          // make sure the password is correctly hashed
          UserModel.find({ email: user.email }, (err, users) => {
            if (err) { console.error(err) }
            users.should.have.length(1)
            users[0].email.should.equals(user.email)
            argon2.verify(users[0].password, user.password).then((valid: boolean) => {
              valid.should.be.true
            });
            done()
          })
        });
    });

    // eventually we need tests to make sure emails and passwords follow the rules behind them
    var runs = [
      {
        test: "should not allow empty emails",
        user: {
          username: "test",
          password: TEST_PASSWORD,
        },
        assertions: (res: any) => {
          res.should.have.status(200)
          res.body.should.have.property("error")
          res.body.error.should.equals(errors.MissingCredentials)
        }
      },
      {
        test: "should not allow empty username",
        user: {
          email: "test@example.com",
          password: TEST_PASSWORD,
        },
        assertions: (res: any) => {
          res.should.have.status(200)
          res.body.should.have.property("error")
          res.body.error.should.equals(errors.MissingCredentials)
        }
      },
      {
        test: "should not allow empty password",
        user: {
          password: TEST_PASSWORD,
          email: "test3@example.com",
        },
        assertions: (res: any) => {
          res.should.have.status(200)
          res.body.should.have.property("error")
          res.body.error.should.equals(errors.MissingCredentials)
        }
      },
      {
        test: "should not allow duplicate accounts",
        user: {
          username: "test",
          email: "test@gmail.com",
          password: TEST_PASSWORD,
        },
        assertions: (res: any) => {
          res.should.have.status(200)
          res.body.should.have.property("error")
          res.body.error.should.equals(errors.UserAlreadyExists)
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
    let user: User
    beforeEach((done) => {
      setupUsersAndSession(1).then((resp: SessionEnv) => {
        user = resp.users[0]
        done()
      })
        .catch((err) => { console.error(err) })
    })

    it("logs users in with correct cridentials", done => {
      chai
        .request(app)
        .post("/auth/login")
        .send({ email: "user0@example.com", password: "user0" })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.empty
          res.header.should.have.property("set-cookie")
          // check that the user is logged in
          chai
            .request(app)
            .get("/api/user")
            .set("cookie", res.header["set-cookie"])
            .end((err, res) => {
              res.should.have.status(200)
              res.body.should.have.property("email")
              res.body.email.should.equals(user.email)
              done()
            })

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
          email: "user0@example.com",
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

  describe("Access without valid session", () => {
    it("should not show a profile", (done) => {
      chai
        .request(app)
        .get("/api/user")
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
        .send({ title: "Test Story" })
        .end((err, res) => {
          if (err) {
            console.log(err)
          }
          res.should.have.status(401)
          done()
        })
    })
  });
});

// TODO: test logging out and make sure it destroys the token so the user can't use it any more