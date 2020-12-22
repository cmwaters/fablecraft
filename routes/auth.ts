import * as express from "express";
import * as dotenv from 'dotenv';
import passport from "passport";
const router = express.Router();
import jwt from  'jsonwebtoken'

dotenv.config({path: `.env.${process.env.NODE_ENV}`})


router.post("/signup", async (req, res, next) => { 
  passport.authenticate('signup', async (err, user, info) => {
    if (err) {
      const error = new Error('An Error occurred')
        return next(error);
    } else if (info) {
      return res.status(200).send({ 
        error: info.message
      })
    } else {
      try {
        // we have created the user now we login by creating a token that we can return them
        req.logIn(user, async (error) => {
          if( error ) return next(error)
          // Send back acknowledgement of created user
          return res.status(201).send()
        });
      } catch (error) {
        return next(error)
      }
    }
  })(req, res, next)
});

router.post('/login', async (req, res, next) => {
  passport.authenticate('login', (err, user, info) => {   
    if(err){
      const error = new Error('An Error occurred: ' + err)
      return next(error);
    } else if (info && !user) {
      return res.status(200).send({ error: info.message })
    } else { 
      req.login(user, (err) => {
        if (err) { return next(err) }
        return res.status(200).send('You were authenticated & logged in!\n')
      })
    }
  })(req, res, next);
});

export default router;

