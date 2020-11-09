import * as express from "express";
import passport from "passport";
const router = express.Router();
import jwt from  'jsonwebtoken'


router.post("/signup", passport.authenticate('signup', { session : false }), async (req, res) => {
  return res.json({
    message: "Signup successful",
    user: req.user
  })
});

router.post('/login', async (req, res, next) => {
  passport.authenticate('login', async (err, user, info) => {     try {
      if(err || !user){
        const error = new Error('An Error occured')
        return next(error);
      }
      req.login(user, { session : false }, async (error) => {
        if( error ) return next(error)
        //We don't want to store the sensitive information such as the
        //user password in the token so we pick only the email and id
        const body = { _id : user._id, email : user.email };
        //Sign the JWT token and populate the payload with the user email and id
        const token = jwt.sign({ user : body },'top_secret');
        //Send back the token to the user
        return res.json({ token });
      });     } catch (error) {
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

