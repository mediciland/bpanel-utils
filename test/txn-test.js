import { assert } from 'chai';

const { TxnManager, options } = require('../lib/txnManager.js');

const receiveDiffWallet = require('./data/receive-different-wallet.json');
const sendDiffWallet = require('./data/send-different-wallet.json');
const sendSameWalletDiffAccount = require('./data/send-same-wallet-different-account.json');
const sendSameWalletSameAccount = require('./data/send-same-wallet-same-account.json');

const coinbaseOne = require('./data/coinbase-one.json');
const coinbaseTwo = require('./data/coinbase-two.json');

let localOpts;

describe('Transaction Manager', () => {
  it('should instantiate from options', () => {

    const copy = {
      ...options.copy,
      SEND: 'foo',
      RECEIVE: 'bar'
    };
    localOpts = { ...options, copy };

    const txnManager = TxnManager.fromOptions(localOpts);

    assert.ok(txnManager);

  });

  it('should modify its constants', () => {
    const constants = {
      ...options.constants,
      SEND: 'foo',
      RECEIVE: 'bar'
    };
    localOpts = { ...options, constants };

    const txnManager = TxnManager.fromOptions(localOpts);

    assert.equal(txnManager.constants.SEND, constants.SEND);
    assert.equal(txnManager.constants.RECEIVE, constants.RECEIVE);
  });

  xit('should identify coinbase transactions', () => {
    let txns;

    const txnManager = TxnManager.fromOptions(options);

    txns = txnManager.parse(coinbaseOne);
    assert.equal(coinbaseOne.length, txns.length);

    txnManager.refresh();

    txns = txnManager.parse(coinbaseTwo);
    assert.equal(coinbaseTwo.length, txns.length)
  });

  // TODO: assert around uxtype
  it('should identify deposit transactions', () => {
    const txnManager = TxnManager.fromOptions(options);

    const txns = txnManager.parse(receiveDiffWallet);
    assert.equal(receiveDiffWallet.length, txns.length)

  });

  // TODO: assert around uxtype
  xit('should identify withdrawal transactions', () => {
    const txnManager = TxnManager.fromOptions(options);

    const txns = txnManager.parse(sendDiffWallet);
    assert.equal(sendDiffWallet.length, txns.length)
  });

  // TODO: assert around uxtype
  xit('should identify transactions sent to same account', () => {
    const txnManager = TxnManager.fromOptions(options);
    const txns = txnManager.parse(sendSameWalletSameAccount);
  })
});

