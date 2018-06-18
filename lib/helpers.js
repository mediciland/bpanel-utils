/*!
 * index.js - basic utilities for bpanel
 * Copyright (c) 2018, Bcoin Devs(MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

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

export default {
  now,
  camelize,
  safeSet,
  preventDefault
};
