const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());

const db = require('./db');

app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res, next)=> res.sendFile(path.join(__dirname, 'index.html')));

app.use((err, req, res, next)=> {
  res.status(err.status || 500).send({ message: err.message});
});


db.sync()
  .then(()=> {
    const port = process.env.PORT || 8000;
    app.listen(port, ()=> {
      console.log(port);
    });
  });
