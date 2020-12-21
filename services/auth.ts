import passport from "passport";
import * as dotenv from 'dotenv'
import * as LocalStrategy from "passport-local";
import * as argon2 from "argon2";
import { Strategy, ExtractJwt } from 'passport-jwt'
import { randomBytes } from "crypto";
import { User, UserModel} from '../models/user'
import { DocumentQuery } from "mongoose";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

// Create a passport middleware to handle user registration
passport.use('signup', new LocalStrategy.Strategy({
  usernameField : 'email',
  passwordField : 'password'
}, async (email, password, done) => {
    try {
      // make sure an account of the same email doesn't already exist
      const existingUser = await UserModel.findOne({ email: email})
      if (existingUser) {
        return done(null, false, { message: "User already exists" })
      }
    
      const salt = randomBytes(32);
      const passwordHashed = await argon2.hash(password, { salt });
      //Save the information provided by the user to the the database
      const user = await UserModel.create({ 
        email: email, 
        password: passwordHashed,
        name: "",
        stories: [],
        lastStory: undefined, 
      });
      //Send the user information to the next middleware
      return done(null, user);
    } catch (error) {
      return done(error);
    }
}));

//Create a passport middleware to handle User login
passport.use('login', new LocalStrategy.Strategy({
  usernameField : 'email',
  passwordField : 'password'
}, (email, password, done) => {
  console.log("here")
  // Find the user associated with the email provided by the user
  UserModel.findOne({ email:email }, (err:any, user: User | null) => {
    if (err) { return done(err)} 
    if (!user) {
      return done(null, false, { message : 'User not found'});
    } 
    // Validate password and make sure it matches with the corresponding hash stored in the database
    // If the passwords match, it returns a value of true.
    argon2.verify(user.password, password).then((valid) => {
      if (valid) {
        //Send the user information to the next middleware
        return done(null, user, { message: 'Logged in Successfully' });
      } else {
        return done(null, false, { message: 'Incorrect Password' });
      }
    });
  });
}));

passport.serializeUser((user:User, done) => {
  console.log("Serializing user")
  done(null, user._id)
})

passport.deserializeUser((id, done) => {
  console.log("Deserializing user")
  UserModel.findById(id, (err, user) => {
    done(err, user)
  })
})

//This verifies that the token sent by the user is valid
passport.use('jwt', new Strategy({
  //secret we used to sign our JWT
  secretOrKey : process.env.SECRET,
  //we expect the user to send the token as a query parameter with the name 'token'
  jwtFromRequest : ExtractJwt.fromUrlQueryParameter('token')
}, async (token: any, done: Function) => {
  try {
    //Pass the user details to the next middleware
    UserModel.findById(token.user._id, (err, user) => {
      if (err) {
        return done(err)
      } else {
        return done(null, user)
      }
    })
  } catch (error) {
    return done(error);
  }
}));
