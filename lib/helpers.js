/*!
 * index.js - basic utilities for bpanel
 * Copyright (c) 2018, Bcoin Devs(MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

function now() {
  return Math.floor(Date.now() / 1000);
}

module.exports = {
  now
};