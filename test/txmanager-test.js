import { assert } from 'chai';
const { TxManager, TxManagerOptions } = require('../lib/txManager.js');
import { UXTX, UXTXOptions  } from '../lib/uxtx.js';

const coinbaseOne = require('./data/coinbase-one.json');
const coinbaseTwo = require('./data/coinbase-two.json');

let localOpts;

describe('Transaction Manager', () => {
  it('should instantiate from options', () => {
    const txManager = TxManager.fromOptions({});
    assert.ok(txManager);
  });

  it('should modify its constants', () => {
    const options = {
      custom: () => 'foobar',
    };

    const txManager = TxManager.fromOptions(options);

    assert.equal(options.custom(), txManager._custom());
  });

  it('should parse all transactions', () => {
    let txns;

    const txManager = TxManager.fromOptions(TxManagerOptions);

    txns = txManager.parse(coinbaseOne, UXTXOptions);
    assert.equal(coinbaseOne.length, txns.length);

  });

  it('should be able to clear its cache', () => {
    let txns;
    const txManager = TxManager.fromOptions(TxManagerOptions);

    // make sure transaction lists are of different length
    assert.notEqual(coinbaseOne.length, coinbaseTwo.length);

    // parse first set of txs, get all of them
    txns = txManager.parse(coinbaseOne, UXTXOptions);
    assert.equal(coinbaseOne.length, txns.length);

    // clear cache here
    txManager.refresh();

    // parse more transactions, list of different size
    txns = txManager.parse(coinbaseTwo, UXTXOptions);

    // asset output is of recent list size
    assert.equal(coinbaseTwo.length, txns.length)
  });
});


