import { assert } from 'chai';
const { TxManager, TxManagerOptions } = require('../lib/txManager.js');
import UXTX from '../lib/uxtx.js';
import UXTXOptions from '../lib/uxtxOptions.js';

const receiveDiffWallet = require('./data/receive-different-wallet.json');
const sendDiffWallet = require('./data/send-different-wallet.json');
const sendSameWalletDiffAccount = require('./data/send-same-wallet-different-account.json');
const sendSameWalletSameAccount = require('./data/send-same-wallet-same-account.json');

const coinbaseOne = require('./data/coinbase-one.json');
const coinbaseTwo = require('./data/coinbase-two.json');

let localOpts;

describe('Transaction Manager', () => {
  it('should instantiate from options', () => {
    const txManager = TxManager.fromOptions({});
    assert.ok(txManager);
  });

  it('should modify its constants', () => {
    const labels = {
      ...UXTXOptions.labels,
      SEND: 'foo',
      RECEIVE: 'bar'
    };
    localOpts = { ...TxManagerOptions, labels };

    const txManager = TxManager.fromOptions(localOpts);

    const managerLabels = txManager.getLabels();

    assert.equal(managerLabels.SEND, labels.SEND);
    assert.equal(managerLabels.RECEIVE, labels.RECEIVE);
  });

  it('should parse all transactions', () => {
    let txns;

    const txManager = TxManager.fromOptions(TxManagerOptions);

    txns = txManager.parse(coinbaseOne);
    assert.equal(coinbaseOne.length, txns.length);

  });

  it('should be able to clear its cache', () => {
    let txns;
    const txManager = TxManager.fromOptions(TxManagerOptions);

    // make sure transaction lists are of different length
    assert.notEqual(coinbaseOne.length, coinbaseTwo.length);

    // parse first set of txs, get all of them
    txns = txManager.parse(coinbaseOne);
    assert.equal(coinbaseOne.length, txns.length);

    // clear cache here
    txManager.refresh();

    // parse more transactions, list of different size
    txns = txManager.parse(coinbaseTwo);

    // asset output is of recent list size
    assert.equal(coinbaseTwo.length, txns.length)
  });
});

describe('User Experience TX', () => {
  it('should identify coinbase transactions', () => {
    // single coinbase tx
    const tx = coinbaseOne[0];

    const options = {
      ...UXTXOptions,
      json: tx,
    };

    const uxtx = UXTX.fromRaw(tx.tx, 'hex', options);
    const types = uxtx.getTypes();
    assert.equal(uxtx.getUXType(), types.COINBASE);
  });

  it('should identify deposit transactions', () => {
    // single deposit tx
    const tx = receiveDiffWallet[0];
    const options = {
      ...UXTXOptions,
      json: tx,
    };

    const uxtx = UXTX.fromRaw(tx.tx, 'hex', options);
    const types = uxtx.getTypes();
    const type = uxtx.getUXType();

    assert.equal(type, types.DEPOSIT);
  });

  it('should identify withdrawal transactions', () => {
    // single coinbase tx
    const tx = sendDiffWallet[0];
    const options = {
      ...UXTXOptions,
      json: tx,
    }
    const uxtx = UXTX.fromRaw(tx.tx, 'hex', options);
    const types = uxtx.getTypes();
    const type = uxtx.getUXType();

    assert.equal(type, types.WITHDRAW);
  });
});

