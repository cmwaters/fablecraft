import * as dotenv from 'dotenv'
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import "./models/user"
import authRouter from './routes/auth';
import apiRouter from './routes/api';
import passport from 'passport';
import path from 'path'

dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })

import './services/auth'
let clientRouter = express.Router();



export const app = express();

mongoose.connect(process.env.DATABASE_URL!, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:false});
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => {
  console.log("Connected to database")
});

app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'client')));

app.use(bodyParser.json());
app.use(express.json());
app.use(session({
  secret: process.env.SECRET!,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize())
app.use(passport.session())

let authenticated = (req: any, res: any, next: any) => {
  console.log(req.user)
  if (req.isAuthenticated()) {
    next()
  } else {
    return res.status(401).send()
  }
}

clientRouter.get('/', (req, res, next) => {
  console.log("Starting client")
  res.render('index')
})

clientRouter.get('/test', (req, res, next) => {
  res.status(200).send({message: "test successful"})
})

//IMPORT ROUTES
app.use('/', clientRouter)
app.use('/auth', authRouter);
app.use('/api', authenticated, apiRouter);



const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('Fablecraft server listening on port ' + PORT + ' in ' + process.env.NODE_ENV + ' mode') 
})
