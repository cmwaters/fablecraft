import * as dotenv from 'dotenv'
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import * as bodyParser from 'body-parser';
import "./server/models/user"
import authRouter from './server/routes/auth';
import apiRouter from './server/routes/api';
// import * as http from 'http'
import passport from 'passport';
// import debug from 'debug';
import flash from 'connect-flash'
import path from 'path'
let clientRouter = express.Router();

dotenv.config()

const app = express();

//IMPORT ROUTES

mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost/fablecraft", { useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => {
  console.log("Connected to database")
});

app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'client')));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.json());
app.use(express.json());
app.use(session({ 
  secret: process.env.SECRET || "fablecraft",
  resave: true,
  saveUninitialized: true
}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())


// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", 'http://localhost:3000'); // update to match the domain you will make the request from
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   res.header("Access-Control-Allow-Methods", "PUT, DELETE");
//   console.log(new Date().toISOString().slice(0,19), ' ' , req.method, ' ', req.originalUrl);
//   next();
// });

clientRouter.get('/', (req, res, next) => {
  console.log("Starting client")
  res.render('index')
})

app.use('/', clientRouter)
app.use('/auth', authRouter);
app.use('/api', apiRouter);


const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('Fablecraft server listening on port ' + PORT) 
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