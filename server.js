const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());

const db = require('./db');

app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use((req, res, next)=>{
  if(req.headers.authentication){
    return next();
  }
  db.findUserFromToken(req.headers.authentication)
  .then(user=>{
    req.user= user;
    next();
  })
  .catch(next);
});

const isLoggedIn = (req, res, next)=> {
  if(!req.user){
    const err = Error('not authenticated');
    err.status = 401;
    return next(err);
  }
  next();
};

app.get('/', (req, res, next)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', (req, res, next)=>{
  db.authentication(req.body)
  .then(token => res.send({token}))
  .catch(next);
});

app.get('/api/auth', isLoggedIn, (req, res, next)=>{
  res.send(req.user);
  });

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
