/*!
 * clients.js - client extensions of bclient to connect to bpanel app server
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import { NodeClient, WalletClient } from 'bclient';
import MultisigClient = from 'bmultisig/lib/client';

export const { bpanelPort, ssl, nodePath, walletPath, hostname } = options();

let nodeClient = null;
let walletClient = null;
let multisigClient = null;

function bpanelClient() {
  if (!nodeClient)
    nodeClient = new NodeClient({
      port: bpanelPort,
      host: hostname,
      path: nodePath,
      ssl
    });

  return nodeClient;
}

function bwalletClient() {
  if (!walletClient)
    walletClient = new WalletClient({
      port: bpanelPort,
      path: walletPath,
      host: hostname,
      ssl
    });

  return walletClient;
}

function bmultisigClient() {
  if (!multisigClient)
    multisigClient = new MultisigClient({
      port: bpanelPort,
      path: walletPath,
      host: hostname,
      ssl
    });

  return multisigClient;
}

function options() {
  // bpanel endpoints
  const nodePath = '/bcoin';
  const walletPath = '/bwallet';
  // determine the port and ssl usage
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  let port = window.location.port;
  let ssl = false;
  // use https and http ports when the window doesn't render them
  if (port === '') protocol === 'https:' ? (port = '443') : (port = '80');
  if (protocol === 'https:') ssl = true;
  return {
    bpanelPort: parseInt(port, 10),
    ssl,
    hostname,
    nodePath,
    walletPath
  };
}

export { bpanelClient, bwalletClient, bmultisigClient };
