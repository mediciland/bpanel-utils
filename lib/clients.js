/*!
 * clients.js - client extensions of bclient to connect to bpanel app server
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import { NodeClient, WalletClient } from 'bclient';

export const nodePath = '/node';
export const walletPath = '/node/wallet';
export const bpanelPort = parseInt(window.location.port);

let nodeClient = null;
let walletClient = null;

function bpanelClient() {
  if(!nodeClient)
    nodeClient = new NodeClient({ port: bpanelPort, path: nodePath })

  return nodeClient;
}

function bwalletClient() {
  if(!walletClient)
    walletClient = new WalletClient({ port: bpanelPort, path: walletPath })

  return walletClient;
}

export {
  bpanelClient,
  bwalletClient
}