import * as express from "express";
import * as dotenv from 'dotenv';
import passport from "passport";
const router = express.Router();
// import jwt from 'jsonwebtoken'
import { signUp } from "../services/auth"
import { errors } from "../services/errors"

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })


router.post("/signup", async (req, res, next) => {
  let { username, password, email } = req.body;
  signUp(username, password, email).then(user => {
    return res.status(201).send({ 
      username: user.username, 
      email: user.email, 
      name: user.name,
      lastDocument: user.lastDocument,
      documents: user.documents
    })
  }).catch(err => {
    switch (err) { 
      case errors.UserAlreadyExists:
      case errors.InvalidPassword:
      case errors.InvalidEmail:
      case errors.InvalidUsername:
      case errors.MissingCredentials:
        return res.status(200).send({
          error: err
        })
      default:
        console.error(err)
        next(err)
    }
  })
});

router.post('/login', async (req, res, next) => {
  console.log(req.body)
  passport.authenticate('login', (err, user, info) => {
    if (err) {
      const error = new Error('An Error occurred: ' + err.message)
      return next(error);
    } else if (info && !user) {
      return res.status(200).send({ error: info.message })
    } else {
      req.login(user, (err) => {
        if (err) { return next(err) }
        return res.status(200).send(user.withoutPassword())
      })
    }
  })(req, res, next);
});

export default router;

