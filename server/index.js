const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.static(path.dirname(__dirname) + '/dist'));

app.get('/', (req, res, next) => {
  console.log("Starting client")
  res.sendFile(path.join(__dirname + '/dist/index.html'));
})

app.listen(PORT, () => {
  console.log('Fablecraft server listening on port ' + PORT + ' in ' + process.env.NODE_ENV + ' mode') 
})
