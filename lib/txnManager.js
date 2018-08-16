const assert = require('bsert');
import TXUX from './uxtx.js';

// importing to bundle with TxnManagerOptions
import UXTXOptions from './uxtxOptions';

class TxnManager {
  constructor(options) {
    // hash -> parsed transaction
    this._parsed = {};

    this._constants = null;
    this._custom = null;
    this._labels = null;

    if (options)
      this.fromOptions(options);
  }

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   * @param {Object} options.constants - internal constants
   * @param {Object} options.labels
   *   human readable labels, used in toJSON output
   */
  fromOptions(options) {
    assert(typeof options === 'object', 'must pass options object');
    if (options.custom) {
      assert(typeof options.custom === 'function');
      this._custom = options.custom;
    }

    if (options.constants) {
      // TODO: validation
      this._constants = options.constants;
    }

    if (options.labels) {
      // TODO: validation
      this._labels = options.labels;
    }

    return this;
  }

  getConstants() {
    assert(this._constants);
    return this._constants;
  }

  getLabels() {
    assert(this._labels);
    return this._labels;
  }

  /**
   * Clear any cached values.
   */
  refresh() {
    this._parsed = {};
  }

  /**
   * Parse transactions into human readable form
   * @param {Object[]} transactions
   * @param {String|null} wallet
   * @param {Boolen} bust - bust the cache
   *
   * User can call more than once for transactions
   * from different wallets
   */
  parse(transactions, wallet = null, bust = false) {
    assert(Array.isArray(transactions), 'Must pass list of txs');
    // use custom parsing function
    if (this._custom) {
      const out = this._custom(transactions, wallet, bust);
      assert(Array.isArray(out), 'Must return list from custom tx parse function');
      return out;
    }

    // get internal options to pass to managed txs
    const constants = this.getConstants();
    const labels = this.getLabels();

    return transactions.map(txn => {
      // no global bust and the transaction already parsed
      if (bust === false && txn.hash in this._parsed)
        return this._parsed[txn.hash];

      // TODO: redundant info being passed
      // txn and txn.tx
      const options = {
        constants,
        labels,
        json: txn,
        wallet,
      };

      const txux = TXUX.fromRaw(txn.tx, 'hex', options);

      // cache output
      const json = txux.toJSON();
      this._parsed[txn.hash] = json;

      return json;
    });
  }
}

// initial label values
// NOTE: many are the same, but
// they are decoupled
const labels = {
  WITHDRAW: 'Sent',
  DEPOSIT: 'Received',
  COINBASE: 'Coinbase',
  MULTIPLE_OUTPUT: 'Multiple',
  MULTIPLE_ADDRESS: 'Multiple',
  MULTIPLE_ACCOUNT: 'Multiple',
  UNKNOWN_ADDRESS: 'Unknown',
  UNKNOWN_ACCOUNT: 'Unknown',
};
// initial null custom parsing function
const custom = null;
// initial constants
const constants = {
  DATE_FORMAT: 'MM/DD/YY hh:mm a',
};

// initial options
// bundle together with TXUX opts
// for simplicity in importing
// manager to handle many transactions
const TxnManagerOptions = {
  labels,
  ...UXTXOptions
};

module.exports = {
  TxnManager,
  TxnManagerOptions,
}

