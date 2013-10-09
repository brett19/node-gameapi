'use strict';

var db = require('./../database').mainBucket;
var couchbase = require('couchbase');

function StateModel() {
}

StateModel.save = function(uid, name, preVer, data, callback) {
  var stateDocName = 'user-' + uid + '-state';
  db.get(stateDocName, function(err, result) {
    if (err) {
      if (err.code !== couchbase.errors.keyNotFound) {
        return callback(err);
      }
    }

    var stateDoc = {
      type: 'state',
      uid: uid,
      states: {}
    };
    if (result.value) {
      stateDoc = result.value;
    }

    var stateBlock = {
      version: 0,
      data: null
    };
    if (stateDoc.states[name]) {
      stateBlock = stateDoc.states[name];
    } else {
      stateDoc.states[name] = stateBlock;
    }

    if (stateBlock.version !== preVer) {
      return callback('Your version does not match the server version.');
    } else {
      stateBlock.version++;
      stateBlock.data = data;
    }

    var setOptions = {};
    if (result.value) {
      setOptions.cas = result.cas;
    }

    db.set(stateDocName, stateDoc, setOptions, function(err, result) {
      if (err) {
        return callback(err);
      }

      callback(null, stateBlock);
    });
  });
};

StateModel.findByUserId = function(uid, callback) {
  var stateDocName = 'user-' + uid + '-state';
  db.get(stateDocName, function(err, result) {
    if (err) {
      if (err.code === couchbase.errors.keyNotFound) {
        return callback(null, {});
      } else {
        return callback(err);
      }
    }
    var stateDoc = result.value;

    callback(null, stateDoc.states);
  });
};

StateModel.get = function(uid, name, callback) {
  var stateDocName = 'user-' + uid + '-state';

  db.get(stateDocName, function(err, result) {
    if (err) {
      return callback(err);
    }
    var stateDoc = result.value;

    if (!stateDoc.states[name]) {
      return callback('No state block with this name exists.');
    }

    callback(null, stateDoc.states[name]);
  });
};

module.exports = StateModel;