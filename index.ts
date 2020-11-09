import * as dotenv from 'dotenv'
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import * as bodyParser from 'body-parser';
import "./models/user"
import authRouter from './routes/auth';
import apiRouter from './routes/api';
import passport from 'passport';
import path from 'path'

import './services/auth'
let clientRouter = express.Router();

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

export const app = express();

mongoose.connect(process.env.DATABASE_URL!, { useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => {
  console.log("Connected to database")
});

app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'client')));

app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize())
app.use(passport.session())

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
app.use('/api', passport.authenticate('jwt', { session : false }), apiRouter);
// passport.authenticate('jwt', { session : false }),


const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('Fablecraft server listening on port ' + PORT + ' in ' + process.env.NODE_ENV + ' mode') 
})

// /**
//  * Create HTTP server.
//  */

// var server = http.createServer(app);

// /**
//  * Listen on provided port, on all network interfaces.
//  */

// server.listen(PORT);
// server.on('error', onError);
// server.on('listening', onListening);

// /**
//  * Event listener for HTTP server "error" event.
//  */

// function onError(error: any) {
//   if (error.syscall !== 'listen') {
//     throw error;
//   }

//   var bind = typeof PORT === 'string'
//     ? 'Pipe ' + PORT
//     : 'Port ' + PORT;

//   // handle specific listen errors with friendly messages
//   switch (error.code) {
//     case 'EACCES':
//       console.error(bind + ' requires elevated privileges');
//       process.exit(1);
//       break;
//     case 'EADDRINUSE':
//       console.error(bind + ' is already in use for serving fablecraft');
//       process.exit(1);
//       break;
//     default:
//       throw error;
//   }
// }

// /**
//  * Event listener for HTTP server "listening" event.
//  */

// function onListening() {
//   var addr = server.address();
//   var bind = typeof addr === 'string'
//     ? 'pipe ' + addr
//     : 'port ' + addr.port;
//   debug('Listening on ' + bind);
// }