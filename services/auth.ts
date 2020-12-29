import passport from "passport";
import * as dotenv from 'dotenv'
import * as LocalStrategy from "passport-local";
import * as argon2 from "argon2";
// import { Strategy, ExtractJwt } from 'passport-jwt'
import { randomBytes } from "crypto";
import { User, UserModel} from '../models/user'
import { errors } from "../routes/errors"
import * as EmailValidator from 'email-validator';
import PasswordValidator from 'password-validator'

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const MAX_USERNAME_LENGTH = 20

const passwordValidator = new PasswordValidator()

passwordValidator
  .is().min(8)                                    // Minimum length 8
  .is().max(80)                                   // Maximum length 80
  .has().uppercase()                              // Must have uppercase letters
  .has().lowercase()                              // Must have lowercase letters
  .has().digits(2)                                // Must have at least 2 digits
  .has().not().spaces()                           // Should not have spaces

// Create a passport middleware to handle user registration
passport.use('signup', new LocalStrategy.Strategy(
  async (username, password, done) => {
    try {
      // make sure an account of the same email doesn't already exist
      const existingUser = await UserModel.findOne({ username: username})
      if (existingUser) {
        return done(null, false, { message: "User already exists" })
      }
    
      const salt = randomBytes(32);
      const passwordHashed = await argon2.hash(password, { salt });
      //Save the information provided by the user to the the database
      const user = await UserModel.create({ 
        username: username,
        password: passwordHashed,
        email: "",
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
  if (username.length >= MAX_USERNAME_LENGTH) {
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

passport.serializeUser((user:User, done) => {
  done(null, user._id)
})

passport.deserializeUser((id, done) => {
  UserModel.findById(id, (err, user) => {
    done(err, user)
  })
})

//This verifies that the token sent by the user is valid
// passport.use('jwt', new Strategy({
//   //secret we used to sign our JWT
//   secretOrKey : process.env.SECRET,
//   //we expect the user to send the token as a query parameter with the name 'token'
//   jwtFromRequest : ExtractJwt.fromUrlQueryParameter('token')
// }, async (token: any, done: Function) => {
//   try {
//     //Pass the user details to the next middleware
//     UserModel.findById(token.user._id, (err, user) => {
//       if (err) {
//         return done(err)
//       } else {
//         return done(null, user)
//       }
//     })
//   } catch (error) {
//     return done(error);
//   }
// }));
