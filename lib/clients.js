/*!
 * clients.js - client extensions of bclient to connect to bpanel app server
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import { NodeClient, WalletClient } from 'bclient';

export const {
  bpanelPort,
  tls,
  nodePath,
  walletPath
} = options();

let nodeClient = null;
let walletClient = null;

function bpanelClient() {
  if (!nodeClient)
    nodeClient = new NodeClient({ port: bpanelPort, path: nodePath, tls })

  return nodeClient;
}

function bwalletClient() {
  if (!walletClient)
    walletClient = new WalletClient({ port: bpanelPort, path: walletPath, tls })

  return walletClient;
}

function options() {
  // bpanel endpoints
  const nodePath = '/bcoin';
  const walletPath = '/bwallet';
  // determine the port and tls usage
  const protocol = window.location.protocol;
  const port = window.location.port;
  const tls = false;
  // use https and http ports when the window doesn't render them
  if (protocol === 'https:' && port === '') {
    port = '443';
    tls = true;
  } else if (protocol === 'http:' && port === '') {
    port = '80';
  }
  return {
    bpanelPort: parseInt(port),
    tls,
    nodePath,
    walletPath
  }
}

export {
  bpanelClient,
  bwalletClient
}

