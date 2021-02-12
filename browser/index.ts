import express from 'express';
// import * as config from './config.json'

export const app = express();

app.set('view engine', 'pug');

app.get('/', (req, res, next) => {
  console.log("Starting client")
  res.render('index', { title: "Fablecraft"})
})

app.get('/test', (req, res, next) => {
  res.status(200).send({message: "test successful"})
})

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('Fablecraft server listening on port ' + PORT + ' in ' + process.env.NODE_ENV + ' mode') 
})
