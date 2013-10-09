'use strict';

var db = require('./../database').mainBucket;
var couchbase = require('couchbase');
var uuid = require('uuid');

function cleanSessionObj(obj) {
  delete obj.type;
  return obj;
}

function SessionModel() {
}

SessionModel.create = function(uid, callback) {
  var sessDoc = {
    type: 'session',
    sid: uuid.v4(),
    uid: uid
  };
  var sessDocName = 'sess-' + sessDoc.sid;

  db.add(sessDocName, sessDoc, {expiry: 3600}, function(err, result) {
    callback(err, cleanSessionObj(sessDoc), result.cas);
  });
};

SessionModel.touch = function(sid, callback) {
  var sessDocName = 'sess-' + sid;

  db.touch(sessDocName, {expiry: 3600}, function(err, result) {
    callback(err);
  });
};

SessionModel.get = function(sid, callback) {
  var sessDocName = 'sess-' + sid;

  db.get(sessDocName, function(err, result) {
    if (err) {
      return callback(err);
    }

    callback(null, result.value.uid);
  });
};

module.exports = SessionModel;