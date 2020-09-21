import passport from "passport";
import * as LocalStrategy from "passport-local";
import * as argon2 from "argon2";
import { Strategy, ExtractJwt } from 'passport-jwt'
import { randomBytes } from "crypto";
import { UserModel} from '../models/user'


//Create a passport middleware to handle user registration
passport.use('signup', new LocalStrategy.Strategy({
  usernameField : 'email',
  passwordField : 'password'
}, async (email, password, done) => {
    try {
      const salt = randomBytes(32);
      const passwordHashed = await argon2.hash(password, { salt });
      await UserModel.create({
        email: email,
        password: passwordHashed,
      });
      //Save the information provided by the user to the the database
      const user = await UserModel.create({ email, password });
      //Send the user information to the next middleware
      return done(null, user);
    } catch (error) {
      done(error);
    }
}));

//Create a passport middleware to handle User login
passport.use('login', new LocalStrategy.Strategy({
  usernameField : 'email',
  passwordField : 'password'
}, async (email, password, done) => {
  try {
    // Find the user associated with the email provided by the user
    const user = await UserModel.findOne({ email });
    if( !user ){
      // If the user isn't found in the database, return a message
      return done(null, false, { message : 'User not found'});
    }
    // Validate password and make sure it matches with the corresponding hash stored in the database
    // If the passwords match, it returns a value of true.
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return done(null, false, { message : 'Incorrect Password'});
    }
    //Send the user information to the next middleware
    return done(null, user, { message : 'Logged in Successfully'});
  } catch (error) {
    return done(error);
  }
}));

//This verifies that the token sent by the user is valid
passport.use('jwt', new Strategy({
  //secret we used to sign our JWT
  secretOrKey : 'top_secret',
  //we expect the user to send the token as a query paramater with the name 'secret_token'
  jwtFromRequest : ExtractJwt.fromUrlQueryParameter('token')
}, async (token: any, done: Function) => {
  try {
    //Pass the user details to the next middleware
    console.log("valid token " + token.user)
    return done(null, token.user);
  } catch (error) {
    done(error);
  }
}));