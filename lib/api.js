/*!
 * api.js - api client utils for bpanel endpoints
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import { NodeClient, WalletClient } from 'bclient';

export const nodePath = '/node';
export const walletPath = '/node/wallet';
export const bpanelPort = parseInt(window.location.port);

export const bpanelClient = () => new NodeClient({ port: bpanelPort, path: nodePath });
export const bwalletClient = () => new WalletClient({ port: bpanelPort, path: walletPath });

export default { nodePath, walletPath, bpanelPort, bpanelClient, bwalletClient };
