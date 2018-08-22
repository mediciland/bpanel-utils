# bpanel utils

Simple helper utilities for use in bpanel plugins

## Usage

``` js
const utils = require('@bpanel/bpanel-utils');
```

## Utilities

#### User Experience Transaction

```js
import { UXTX } from '@bpanel/bpanel-utils';
import { WalletClient } from 'bclient';

const walletClient = new WalletClient({
  network: 'main',
  port: 8334,
  apiKey: SECRETS.API_KEY,
});

const id = 'primary';
const wallet = walletClient.wallet(id);

/*
 * try fetching the hash yourself
 * curl -s https://blockchain.info/rawblock/0000000000000000000c76fd257881891a21a018c4abd13c33c9f06a822914c9 \
 *   | jq -r .tx[0].hash
 */

const hash = '6b3aafbed09f215d1f95fb06b7c204d12f7657e1bc1ff3dfa37d3248e05a430c';

const tx = await wallet.getTX(hash)

const options = {
  constants: { DATE_FORMAT: 'moment js date format string' },
  labels: {}, // see labels object for usable labels
  json: tx,
  wallet: id, // wallet name
};

const uxtx = UXTX.fromRaw(tx.tx, 'hex', options);

const json = uxtx.toJSON();

```

`uxtx.toJSON` will use the labels and transaction information to
return human readable information about the transaction.
It is particularly useful for calculating tabular data, for example,
displaying if a specific transaction was incoming or outgoing.
There are more ways that this class can be extended, for example detecting
coinjoin transactions or sweep transactions.

#### Tx Manager

A wrapper around `UXTX` to manage many transactions.

```js

import { TxManager, TxManagerOptions, UXTXOptions } from '@bpanel/bpanel-utils';

// set bitcoin as the current chain
UXTXOptions.chain = 'bitcoin';

// use default tx parsing logic
const txManager = TxManager.fromOptions(TxManagerOptions);

const account = 'default';
const txs = await wallet.getHistory(account);

// generate list of UXTX.toJSON with default labels and constants
const parsed = txManager.parse(txs, UXTXOptions);
```


## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

- Copyright (c) 2018, Bcoin Devs (MIT License).

See LICENSE for more info.
