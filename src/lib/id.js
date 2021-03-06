// TODO: use https://github.com/ai/nanoid/#custom-alphabet-or-size
// (for random IDs)

import perma from 'perma'

// var crypto = require('crypto');
// // generate a hash of a specific length
// module.exports = function perma(url, length) {
//   var len = length || 5;
//   // exclude chars: Il0oO=/+ and return only the first len
//   var hash = crypto.createHash('sha512').update(url.toString()).digest('base64').replace(/[Il0oO=\/\+]/g,'');
//   return hash.substring(0, len);
// }

const DATABASE_LENGTH = 16

export function randomId () {
  return databaseId(String(Math.random()))
}

export function databaseId (uri) {
  return perma(uri, DATABASE_LENGTH)
}
