'use strict';

// Various requirements
var express = require('express');
var crypt = require('./crypt');

var accountModel = require('./models/accountmodel');
var sessionModel = require('./models/sessionmodel');
var stateModel = require('./models/statemodel');

// Create and setup our express application
var app = express();
app.use(express.bodyParser());


// Function to handle ensuring a user is authorized
function authUser(req, res, next) {
  req.uid = null;
  if (req.headers.authorization) {
    var authInfo = req.headers.authorization.split(' ');
    if (authInfo[0] === 'Bearer') {
      var sid = authInfo[1];
      sessionModel.get(sid, function(err, uid) {
        if (err) {
          next('Your session id is invalid');
        } else {
          sessionModel.touch(sid, function(){});
          req.uid = uid;
          next();
        }
      });
    } else {
      next('Must be authorized to access this endpoint');
    }
  } else {
    next('Must be authorized to access this endpoint');
  }
}


// Create a session
app.post('/sessions', function(req, res, next) {
  if (!req.body.username) {
    return res.send(400, 'Must specify a username');
  }
  if (!req.body.password) {
    return res.send(400, 'Must specify a password');
  }

  accountModel.getByUsername(req.body.username, function(err, user) {
    if (err) {
      return next(err);
    }

    if (crypt.sha1(req.body.password) !== user.password) {
      return res.send(400, 'Passwords do not match');
    }

    sessionModel.create(user.uid, function(err, session) {
      if (err) {
        return next(err);
      }

      res.setHeader('Authorization', 'Bearer ' + session.sid);

      // Delete the password for security reasons
      delete user.password;
      res.send(user);
    });
  });
});

// Creating a user
app.post('/users', function(req, res, next) {
  if (!req.body.name) {
    return res.send(400, 'Must specify a name');
  }
  if (!req.body.username) {
    return res.send(400, 'Must specify a username');
  }
  if (!req.body.password) {
    return res.send(400, 'Must specify a password');
  }

  // Encrypt the password the user passed in.
  var newUser = req.body;
  newUser.password = crypt.sha1(newUser.password);

  accountModel.create(req.body, function(err, user) {
    if (err) {
      return next(err);
    }

    // Return the user without their password (for security)
    delete user.password;
    res.send(user);
  });
});

// Get my user
app.get('/me', authUser, function(req, res, next) {
  accountModel.get(req.uid, function(err, user) {
    if (err) {
      return next(err);
    }

    delete user.password;
    res.send(user);
  });
});

// Get all state blocks
app.get('/states', authUser, function(req, res, next) {
  stateModel.findByUserId(req.uid, function(err, states) {
    if (err) {
      return next(err);
    }

    res.send(states);
  });
});

// Get one state block
app.get('/state/:name', authUser, function(req, res, next) {
  stateModel.get(req.uid, req.params.name, function(err, state) {
    if (err) {
      return next(err);
    }

    res.send(state);
  });
});

// Update a state block
app.put('/state/:name', authUser, function(req, res, next) {
  stateModel.save(req.uid, req.params.name, parseInt(req.query.preVer, 10),
      req.body, function(err, state) {
    if (err) {
      return next(err);
    }

    res.send(state);
  });
});

// For demonstration
app.get('/', function(req, res, next) {
  res.send({minions: 'Bow before me for I am ROOT!'});
});


// Start listening on port 3000
app.listen(3000, function () {
  console.log('Listening on port 3000');
});
