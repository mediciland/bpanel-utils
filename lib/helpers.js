/*!
 * index.js - basic utilities for bpanel
 * Copyright (c) 2018, Bcoin Devs(MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

const bio = require('bufio');
const bcrypto = require('bcrypto');
const assert = require('bsert');

('use strict');

export const now = () => Math.floor(Date.now() / 1000);

export const camelize = str =>
  str
    .replace(/_/g, '-')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/[^\w]/gi, '');

// safely set a value nested deeply in an objects
export const safeSet = (obj, dotpath, data) => {
  const path = dotpath.split('.');
  let copy = { ...obj };
  let target = copy;
  path.forEach((el, i) => {
    // create an object if it doesn't exist
    if (!(el in target)) {
      target[el] = {};
    }
    // if we are at last iteration
    // set data
    if (i === path.length - 1) {
      target[el] = data;
    }
    target = target[el];
  });
  return copy;
};

// preventDefault can be passed an object
// with an event property or an event itself
export const preventDefault = e => {
  if (e instanceof Event) {
    e.preventDefault();
  } else if (e.event instanceof Event) {
    e.event.preventDefault();
  }
  return e;
};

/* Return a hash string of a given preimage
 * @param {(Buffer|string|Object)} preimage - preimage to be hashed. Strings will be converted to buffers
 * and everything else will be stringified and turned to a buffer
 * @param {string} [algo=SHA256] - hashing algo to use. Supports anything from bcrypto library.
 * @param {number} [offset] - offset to start slice of final hex string
 * @param {number} [_len] - length of hex string from offset
 * @returns {string} hash - sliced string of resulting hash
 */
export function getHash(preimage, algo = 'SHA256', offset, _len) {
  let data = preimage;

  if (!Buffer.isBuffer(data)) {
    let string = preimage
      if (typeof string !== 'string')
        string = JSON.stringify(preimage);
    const bw = bio.write();
    const buffer = bw.writeString(string, 'ascii');
    data = buffer.render();
  }
  assert(bcrypto.hasOwnProperty(algo), `Unknown hashing function ${algo}`);
  const hashBuffer = bcrypto[algo].digest(data);
  const hash = hashBuffer.toString('hex');
  const len = _len ? offset + _len : hash.length;
  return hash.slice(offset, len);
}

/**
 * Check if number is U8 integer
 * @param {Number} value
 * @returns {Boolean}
 */
export function isU8(value) {
  return (value & 0xff) === value;
};

/**
 * Check if number is U16 integer
 * @param {Number} value
 * @returns {Boolean}
 */
export function isU16(value) {
  return (value & 0xffff) === value;
};

export default {
  now,
  camelize,
  safeSet,
  preventDefault,
  getHash,
  isU8,
  isU16,
};
