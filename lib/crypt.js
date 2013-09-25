'use strict';

var crypto = require('crypto');

module.exports.sha1 = function(text) {
  var shasum = crypto.createHash('sha1');
  shasum.update(text);
  return shasum.digest('hex');
};