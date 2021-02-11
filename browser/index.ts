import * as dotenv from 'dotenv'
import express from 'express';
import session from 'express-session';
import * as bodyParser from 'body-parser';
import "./models/user"
import passport from 'passport';
import path from 'path'
import * as config from './config.json'

dotenv.config({ path: `config/.env.${process.env.NODE_ENV}` })

let clientRouter = express.Router();

export const app = express();

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

clientRouter.get('/', (req, res, next) => {
  console.log("Starting client")
  res.render('index', { title: config.name})
})

clientRouter.get('/test', (req, res, next) => {
  res.status(200).send({message: "test successful"})
})

//IMPORT ROUTES
app.use('/', clientRouter)

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('Fablecraft server listening on port ' + PORT + ' in ' + process.env.NODE_ENV + ' mode') 
})
