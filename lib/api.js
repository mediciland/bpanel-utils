/*!
 * api.js - api client utils for bpanel endpoints
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

const node = 'node';
const wallet = 'wallet';

const get = {
  block: heightOrHash => `/${node}/block/${heightOrHash}`,
  info: () => '/${node}',
  wallet: id => `/${node}/${wallet}/${id}`,
  accounts: id => `${node}/${wallet}/${id}/account`,
  account: (id = 'primary', account = 'default') =>
    `/${node}/${wallet}/${id}/account/${account}`
};

const post = {
  tx: (id = 'primary') => `/${node}/${wallet}/${id}/send`
};

module.exports = { get, post };
