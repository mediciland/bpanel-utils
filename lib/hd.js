/*!
 * hd.js - basic utilities for bpanel
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

/*
 * hd hardened flag
 * perform bitwise or with this to get hardened index
 */
const HARDENED_FLAG = 0x80000000;

/*
 * bip 44 purpose
 * see: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 */
const PURPOSE = 44;

/*
 * bip 44 registered coin types by network
 * see: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
const COIN_TYPES = {
  'bitcoin': {
    main: 0,
    testnet: 1,
    regtest: 1,
    simnet: 1,
  },
  'bitcoincash': {
    main: 145,
    testnet: 1,
    regtest: 1,
    simnet: 1,
  },
  'handshake': {
    main: 5353,
    testnet: 5354,
    regtest: 5355,
    simnet: 5356
  },
};

module.exports = {
  HARDENED_FLAG,
  COIN_TYPES,
  PURPOSE,
}
