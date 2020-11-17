import * as express from "express";
import passport from "passport";
const router = express.Router();
import jwt from  'jsonwebtoken'


router.post("/signup", async (req, res, next) => { 
  passport.authenticate('signup', async (err, user, info) => {
    if (err) {
      const error = new Error('An Error occurred')
        return next(error);
    } else if (info) {
      return res.json({ 
        message: "Signup failed",
        error: info.message
      })
    } else {
      try {
        // we have created the user now we login by creating a token that we can return them
        req.login(user, { session : false }, async (error) => {
          if( error ) return next(error)
          //We don't want to store the sensitive information such as the
          //user password in the token so we pick only the email and id
          const body = { _id : user._id, email : user.email};
          //Sign the JWT token and populate the payload with the user email and id
          const token = jwt.sign({ user : body },'top_secret');
          //Send back the token to the user
          return res.json({
            message: "Signup successful",
            user: user,
            token: token
          })
        });
      } catch (error) {
        return next(error)
      }
    }
  })(req, res, next)
});

router.post('/login', async (req, res, next) => {
  passport.authenticate('login', async (err, user, info) => {     
    try {
      if(err){
        const error = new Error('An Error occurred')
        return next(error);
      } else if (info && !user) {
        return res.json({ 
          message: "Login failed",
          error: info.message
        })
      } else { 
        req.login(user, { session : false }, async (error) => {
          if( error ) return next(error)
          //We don't want to store the sensitive information such as the
          //user password in the token so we pick only the email and id
          const body = { _id : user._id, email : user.email };
          //Sign the JWT token and populate the payload with the user email and id
          const token = jwt.sign({ user : body },'top_secret');
          //Send back the token to the user
          return res.json({ token });
        });     
      }
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

router.get("/logout", (req: any, res) => {
  if (req.isUnauthenticated()) {
    return res.redirect("/auth/login")
  }
  req.session.destroy()
  req.logout();
  return res.status(401).send({ message: "You have successfully logged out"});
});

export default router;

