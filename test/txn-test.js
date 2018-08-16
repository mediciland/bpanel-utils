import { assert } from 'chai';
const { TxnManager, TxnManagerOptions } = require('../lib/txnManager.js');
import TXUX from '../lib/uxtx.js';
import TXUXOptions from '../lib/uxtxOptions.js';

const receiveDiffWallet = require('./data/receive-different-wallet.json');
const sendDiffWallet = require('./data/send-different-wallet.json');
const sendSameWalletDiffAccount = require('./data/send-same-wallet-different-account.json');
const sendSameWalletSameAccount = require('./data/send-same-wallet-same-account.json');

const coinbaseOne = require('./data/coinbase-one.json');
const coinbaseTwo = require('./data/coinbase-two.json');

let localOpts;

describe('Transaction Manager', () => {
  xit('should instantiate from options', () => {
    const txnManager = TxnManager.fromOptions({});
    assert.ok(txnManager);
  });

  xit('should modify its constants', () => {
    const labels = {
      ...TXUXOptions.labels,
      SEND: 'foo',
      RECEIVE: 'bar'
    };
    localOpts = { ...TxnManagerOptions, labels };

    const txnManager = TxnManager.fromOptions(localOpts);

    const managerLabels = txnManager.getLabels();

    assert.equal(managerLabels.SEND, labels.SEND);
    assert.equal(managerLabels.RECEIVE, labels.RECEIVE);
  });

  xit('should parse all transactions', () => {
    let txns;

    const txnManager = TxnManager.fromOptions(TxnManagerOptions);

    txns = txnManager.parse(coinbaseOne);
    assert.equal(coinbaseOne.length, txns.length);

  });

  xit('should be able to clear its cache', () => {
    let txns;
    const txnManager = TxnManager.fromOptions(TxnManagerOptions);

    // make sure transaction lists are of different length
    assert.notEqual(coinbaseOne.length, coinbaseTwo.length);

    // parse first set of txs, get all of them
    txns = txnManager.parse(coinbaseOne);
    assert.equal(coinbaseOne.length, txns.length);

    // clear cache here
    txnManager.refresh();

    // parse more transactions, list of different size
    txns = txnManager.parse(coinbaseTwo);

    // asset output is of recent list size
    assert.equal(coinbaseTwo.length, txns.length)
  });
});

describe('TX User Experience', () => {
  it('should identify coinbase transactions', () => {
    // single coinbase tx
    const tx = coinbaseOne[0];

    const options = {
      ...TXUXOptions,
      json: tx,
    };

    const txux = TXUX.fromRaw(tx.tx, 'hex', options);
    const types = txux.getTypes();
    assert.equal(txux.getUXType(), types.COINBASE);
  });

  it('should identify deposit transactions', () => {
    // single deposit tx
    const tx = receiveDiffWallet[0];
    const options = {
      ...TXUXOptions,
      json: tx,
    };

    const txux = TXUX.fromRaw(tx.tx, 'hex', options);
    const types = txux.getTypes();
    const type = txux.getUXType();

    assert.equal(type, types.DEPOSIT);
  });

  it('should identify withdrawal transactions', () => {
    // single coinbase tx
    const tx = sendDiffWallet[0];
    const options = {
      ...TXUXOptions,
      json: tx,
    }
    const txux = TXUX.fromRaw(tx.tx, 'hex', options);
    const types = txux.getTypes();
    const type = txux.getUXType();

    assert.equal(type, types.WITHDRAW);
  });
});

