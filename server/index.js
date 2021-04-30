const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 8080;

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(path.dirname(__dirname), '/static'))

app.use(express.static(path.dirname(__dirname) + '/static'));

app.get('/', (req, res, next) => {
  console.log("Starting client")
  res.render('index', { title: "Fablecraft"})
})

app.listen(PORT, () => {
  console.log('Fablecraft server listening on port ' + PORT + ' in ' + process.env.NODE_ENV + ' mode') 
})
