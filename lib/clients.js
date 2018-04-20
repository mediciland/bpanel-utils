/*!
 * clients.js - client extensions of bclient to connect to bpanel app server
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import { NodeClient, WalletClient } from 'bclient';

export const {
  bpanelPort,
  ssl,
  nodePath,
  walletPath
} = options();

let nodeClient = null;
let walletClient = null;

function bpanelClient() {
  if (!nodeClient)
    nodeClient = new NodeClient({ port: bpanelPort, path: nodePath, ssl });

  return nodeClient;
}

function bwalletClient() {
  if (!walletClient)
    walletClient = new WalletClient({ port: bpanelPort, path: walletPath, ssl });

  return walletClient;
}

function options() {
  // bpanel endpoints
  const nodePath = '/bcoin';
  const walletPath = '/bwallet';
  // determine the port and ssl usage
  const protocol = window.location.protocol;
  let port = window.location.port;
  let ssl = false;
  // use https and http ports when the window doesn't render them
  if (port === '') protocol === 'https:' ? port = '443' : port = '80';
  if (protocol === 'https:') ssl = true;
  return {
    bpanelPort: parseInt(port),
    ssl,
    nodePath,
    walletPath
  }
}

export {
  bpanelClient,
  bwalletClient
}

