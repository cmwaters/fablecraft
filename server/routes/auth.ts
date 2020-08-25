import e, * as express from "express";
import passport from "passport";
import * as LocalStrategy from "passport-local";
import * as argon2 from "argon2";
const router = express.Router();
import mongoose from 'mongoose';
import { randomBytes } from "crypto";
// const User = mongoose.model("User");
import { User, UserModel} from '../models/user'

passport.use(
  new LocalStrategy.Strategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    async function (req, username, password, done) {
      console.log(req.session)
      const user = await UserModel.findOne({ email: username });
      if (!user) {
        console.log("incorrect username");
        return done(null, false, req.flash("message", "Invalid email."));
      }
      const correctPassword = await argon2.verify(user.password, password);
      if (!correctPassword) {
        console.log("incorrect password");
        return done(null, false, req.flash("message", "Incorrect password."));
      }
      console.log("successfully logged in " + user)
      return done(null, user);
    }
  )
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/auth/",
    failureRedirect: "/auth/login/",
    failureFlash: true,
  })
);

router.get('/login', function(req, res, next) {
  const flash = req.flash("message");
  if (flash.length !== 0) {
    return res.status(200).send({ message: flash });
  }
  if (req.isAuthenticated()) {
    return res.redirect("/auth")
  }
  return res.status(200).send({ message: "You are not logged in. Enter your email and password to login."})
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    console.log(email);
    const salt = randomBytes(32);
    const passwordHashed = await argon2.hash(password, { salt });
    await UserModel.create({
      email: email,
      password: passwordHashed,
      name: name,
    });
    return res
      .status(200)
      .send({ message: "congrats you have made an account" });
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.get("/", (req: any, res) => {
  return res.status(200).send({ message: req.user.email + " is logged in" });
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

