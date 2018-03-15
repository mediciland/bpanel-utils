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

export default {
  now,
  camelize
};