import passport from "passport";
import * as dotenv from 'dotenv'
import * as LocalStrategy from "passport-local";
import * as argon2 from "argon2";
// import { Strategy, ExtractJwt } from 'passport-jwt'
import { randomBytes } from "crypto";
import { User, UserModel} from '../models/user'
import { errors } from "./errors"
import * as EmailValidator from 'email-validator';
import PasswordValidator from 'password-validator'

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const passwordValidator = new PasswordValidator()

passwordValidator
  .is().min(8)                                    // Minimum length 8
  .is().max(80)                                   // Maximum length 80
  .has().uppercase()                              // Must have uppercase letters
  .has().lowercase()                              // Must have lowercase letters
  .has().digits(2)                                // Must have at least 2 digits
  .has().not().spaces()                           // Should not have spaces

const usernameValidator = new PasswordValidator()

usernameValidator
  .is().min(4)                                    // Minimum length 4
  .is().max(20)                                   // Maximum length 20
  .has().not().spaces()                           // Should not have spaces
  .has().not().symbols()                          // Should not have symbols

export async function signUp(username: string, password: string, email: string): Promise<User> {
  return new Promise<User>(async (resolve, reject) => {
    try {
      // validate data
      let err = validateUsername(username);
      if (err) { reject(err); }

      err = validateEmail(email);
      if (err) { reject(err); }

      err = validatePassword(password);
      if (err) { reject(err); }

      // make sure an account of the same email doesn't already exist
      const existingUser = await UserModel.findOne({ username: username })
      if (existingUser) {
        reject(errors.UserAlreadyExists)
      }

      const salt = randomBytes(32);
      const passwordHashed = await argon2.hash(password, { salt });
      //Save the information provided by the user to the the database
      const user = await UserModel.create({
        username: username,
        password: passwordHashed,
        email: email,
        name: "",
        stories: [],
        lastStory: undefined,
      });

      resolve(user);
    } catch (err) {
      reject(err)
    }
  })
}

function validateUsername(username: string): string | undefined {
  if (!username) {
    return errors.MissingCredentials
  }
  if (!usernameValidator.validate(username)) {
    return errors.InvalidUsername
  }
  return undefined
}

function validateEmail(email: string): string | undefined {
  if (!email) {
    return errors.MissingCredentials
  }
  if (!EmailValidator.validate(email)) {
    return errors.InvalidEmail
  }
  return undefined
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return errors.MissingCredentials
  }
  if (!passwordValidator.validate(password)) {
    return errors.InvalidPassword
  }
  return undefined
}

//Create a passport middleware to handle User login
passport.use('login', new LocalStrategy.Strategy({
}, (username, password, done) => {
  // Find the user associated with the username provided by the user
  UserModel.findOne({ username: username }, (err:any, user: User | null) => {
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

passport.serializeUser((user: User, done) => {
  done(null, user._id)
})

passport.deserializeUser((id, done) => {
  UserModel.findById(id, null, null, (err, user) => {
    done(err, user as User)
  })
})

