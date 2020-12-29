import * as express from "express";
import * as dotenv from 'dotenv';
import passport from "passport";
const router = express.Router();
// import jwt from 'jsonwebtoken'
import { signUp } from "../services/auth"
import { errors } from "./errors"

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })


router.post("/signup", async (req, res, next) => {
  let { username, password, email } = req.body;
  signUp(username, password, email).then(user => {
    return res.status(201).send(user.withoutPassword())
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

  // passport.authenticate('signup', async (err, user, info) => {
  //   if (err) {
  //     const error = new Error('An Error occurred: ' + err.message);
  //     return next(error);
  //   } else if (info) {
  //     return res.status(200).send({
  //       error: info.message
  //     })
  //   } else {
  //     try {
  //       req.logIn(user, async (error) => {
  //         if (error) return next(error)
  //         // Send back acknowledgement and the newly created user
  //         if (req.body.email) {

  //         }
  //         return res.status(201).send(user)
  //       });
  //     } catch (error) {
  //       return next(error)
  //     }
  //   }
  // })(req, res, next)
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
        return res.status(200).send(user)
      })
    }
  })(req, res, next);
});

export default router;

