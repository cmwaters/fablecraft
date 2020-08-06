import * as express from 'express';
import passport from 'passport';
import * as LocalStrategy from 'passport-local';
import * as argon2 from 'argon2'
const router = express.Router();
// import * as mongoose from 'mongoose';
import { randomBytes } from 'crypto';
import AuthorModel from '../models/author'

passport.use(new LocalStrategy.Strategy({
    usernameField: 'email',
    passReqToCallback: true,
  },
  async function(req, username, password, done) {
    const author = await AuthorModel.findOne({ email: username })
    if (!author) {
      console.log("incorrect username")
      return done(null, false, req.flash('message', 'Invalid email.'));
    }
    const correctPassword = await argon2.verify(author.password, password)
    if (!correctPassword) {
      console.log("incorrect password")
      return done(null, false, req.flash('message', 'Incorrect password.'));
    }
    return done(null, author);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

router.post('/login',
  passport.authenticate('local', {  successRedirect: '/api/',
                                    failureRedirect: '/api/login',
                                    failureFlash: true })
);

router.get('/login', (req, res) => {
  const flash = req.flash('message')
  if (flash) {
    return res.status(400).send({"message": flash })
  }
  return res.status(200).send({"message": "enter your email and password to login"})
})

router.get('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email)
    const salt = randomBytes(32);
    const passwordHashed = await argon2.hash(password, {salt})
    await AuthorModel.create({
      email: email,
      password: passwordHashed
    })
    return res.status(200).send({"message": "congrats you have made an account"})
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.get('/', (req, res) => {
  return res.status(200).send({ "message": "Success" })
});

router.get('/login', (req, res) => {
  return res.status(200).send({"message": "enter details to login"})
});

export default router

// router.get(`/story`, async (req, res) => {
//     let stories = await Story.find();
//     return res.status(200).send(stories);
// });

// router.post(`/story`, async (req, res) => {
//   let story = await Story.create(req.body);
//   return res.status(201).send(story)
// });

// router.get(`/story/:id`, async (req, res) => {
//   const {id} = req.params;
//   let story = await Story.findById(id);
//   return res.status(200).send(story);
// });

// router.put(`/story/:id`, async (req, res) => {
//   const {id} = req.params;
//   let story = await Story.findById(id);
//   story.title = req.body.title;
//   story.save();
//   return res.status(202).send(story);
// });

// router.delete(`/story/:id`, async(req, res) => {
//   const {id} = req.params;
//   let story = await Story.findByIdAndDelete(id);
//   return res.status(202).send(story)
// });

// router.put(`/story/:id/title`, async(req, res) => {
//   const {id} = req.params;
//   let story = await Story.findById(id);
//   story.title = req.body.title;
//   story.save();
//   return res.status(202).send(story);
// });

// router.post(`/story/:id/card`, async (req, res) => {
//   const {id} = req.params;
//   let story = await Story.findById(id);
//   let card = new Card({
//     text: req.body.text,
//     type: req.body.type,
//     position: story.cards.length
//   });
//   story.cards.push(card);
//   await story.save();
//   return res.status(200).send(story)
// });

// router.put(`/story/:story_id/card/:card_position`, async (req, res) => {
//   const {story_id} = req.params;
//   let {card_position} = req.params;
//   card_position = parseInt(card_position, 10);
//   let story = await Story.findById(story_id);
//   story.cards[card_position] = new Card({
//     text: req.body.text,
//     type: req.body.type,
//     position: card_position
//   });
//   story.save();
//   return res.status(202).send(story)
// });

// router.post(`/story/:story_id/card/:card_position`, async (req, res) => {
//   const {story_id} = req.params;
//   let {card_position} = req.params;
//   card_position = parseInt(card_position, 10);
//   let story = await Story.findById(story_id);
//   if (card_position === story.cards.length) {
//     story.cards.push(new Card(req.body))
//   } else {
//     story.cards.splice(card_position, 0, new Card(req.body));
//     for (let i = (card_position +1); i < story.cards.length; i++) {
//       story.cards[i].position = i;
//     }
//   }
//   await story.save();
//   return res.status(202).send(story)
// });

// router.delete(`/story/:story_id/card/:card_position`, async (req, res) => {
//   const {story_id} = req.params;
//   let {card_position} = req.params;
//   card_position = parseInt(card_position, 10);
//   let story = await Story.findById(story_id);
//   story.cards.splice(card_position, 1);
//   for (let i = card_position; i < story.cards.length; i++) {
//     story.cards[i].position = i;
//   }
//   await story.save();
//   return res.status(202).send(story)
// });

// router.put(`/story/:story_id/card/:card_position/slideDown`, async (req, res) => {
//   const {story_id} = req.params;
//   let {card_position} = req.params;
//   card_position = parseInt(card_position, 10);
//   let story = await Story.findById(story_id);
//   if (card_position !== (story.cards.length - 1)) {
//     [story.cards[card_position].text, story.cards[card_position + 1].text] = [story.cards[card_position + 1].text, story.cards[card_position].text];
//     await story.save( function(err) {
//       if (err) {
//         console.log(err);
//         return res.status(500)
//       }
//     });
//     return res.status(202).send(story)
//   } else {
//     return res.status(400).send({"error": "Trying to slide down the list but element is already the last in the list"})
//   }
// });

// router.put(`/story/:story_id/card/:card_position/slideUp`, async (req, res) => {
//   const {story_id} = req.params;
//   let {card_position} = req.params;
//   card_position = parseInt(card_position, 10);
//   let story = await Story.findById(story_id);
//   if (card_position > 0) {
//     [story.cards[card_position-1].text, story.cards[card_position].text] = [story.cards[card_position].text, story.cards[card_position-1].text];
//     await story.save( function(err) {
//       if (err) {
//         console.log(err);
//         return res.status(500)
//       }
//     });
//     console.log('slid Up ' + card_position);
//     console.log(story.cards[card_position].text);
//     console.log(story.cards[card_position].position);
//     console.log(story.cards[card_position - 1].text);
//     console.log(story.cards[card_position - 1].position);
//     return res.status(202).send(story)
//   } else {
//     return res.status(400).send({"error": "Trying to slide up the list but element is already the first in the list"})
//   }
// });

// module.exports = router;
