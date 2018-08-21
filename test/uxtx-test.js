import { assert } from 'chai';
const { TxManager, TxManagerOptions } = require('../lib/txManager.js');
import { UXTX, UXTXOptions  } from '../lib/uxtx.js';

const coinbaseOne = require('./data/coinbase-one.json');
const receiveDiffWallet = require('./data/receive-different-wallet.json');
const sendDiffWallet = require('./data/send-different-wallet.json');

/*
 * TODO: add tests around this data
 * const sendSameWalletDiffAccount = require('./data/send-same-wallet-different-account.json');
 * const sendSameWalletSameAccount = require('./data/send-same-wallet-same-account.json');
 */

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

