'use strict';

var uuid = require('uuid');
var couchbase = require('couchbase');
var db = require('./../database').mainBucket;

function cleanUserObj(obj) {
  delete obj.type;
  return obj;
}

function AccountModel() {
}

AccountModel.create = function(user, callback) {
  var userDoc = {
    type: 'user',
    uid: uuid.v4(),
    name: user.name,
    username: user.username,
    password: user.password
  };
  var userDocName = 'user-' + userDoc.uid;

  var refDoc = {
    type: 'username',
    uid: userDoc.uid
  };
  var refDocName = 'username-' + userDoc.username;

  db.add(refDocName, refDoc, function(err) {
    if (err && err.code === couchbase.errors.keyAlreadyExists) {
      return callback('The username specified already exists');
    } else if (err) {
      return callback(err);
    }

    db.add(userDocName, userDoc, function(err, result) {
      if (err) {
        return callback(err);
      }

      callback(null, cleanUserObj(userDoc), result.cas);
    });
  });
};

AccountModel.get = function(uid, callback) {
  var userDocName = 'user-' + uid;
  db.get(userDocName, function(err, result) {
    if (err) {
      return callback(err);
    }

    callback(null, cleanUserObj(result.value), result.cas);
  });
};

AccountModel.getByUsername = function(username, callback) {
  var refdocName = 'username-' + username;
  db.get(refdocName, function(err, result) {
    if (err && err.code === couchbase.errors.keyNotFound) {
      return callback('Username not found');
    } else if (err) {
      return callback(err);
    }

    // Extract the UID we found
    var foundUid = result.value.uid;

    // Forward to a normal get
    AccountModel.get(foundUid, callback);
  });
};

module.exports = AccountModel;
