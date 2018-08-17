const assert = require('bsert');
import UXTX from './uxtx.js';

// importing to bundle with TxManagerOptions
import UXTXOptions from './uxtxOptions';

class TxManager {
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
   * @param {Object} options.constants - constants used interally
   * @param {Object} options.labels -
   *   human readable labels, used in toJSON output
   * @param {Object} options.custom -
   *   custom function to apply on list of transaction json
   */
  fromOptions(options) {
    assert(typeof options === 'object', 'must pass options object');
    if (options.custom) {
      assert(typeof options.custom === 'function');
      this._custom = options.custom;
    }

    assert(options.constants, 'Must pass in options.constants');
    this._constants = options.constants;

    assert(options.labels, 'Must pass in options.labels');
    this._labels = options.labels;

    return this;
  }


  /**
   * Return internal constants
   * @returns {Object}
   */
  getConstants() {
    return this._constants;
  }

  /**
   * Return internal labels
   * @returns {Object}
   */
  getLabels() {
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

      // build UXTXOptions
      const options = {
        constants,
        labels,
        json: txn,
        wallet,
      };

      const uxtx = UXTX.fromRaw(txn.tx, 'hex', options);

      // cache output
      const json = uxtx.toJSON();
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
// bundle together with UXTX opts
// so that TxManager can handle setting
// options of all txs it manages
const TxManagerOptions = {
  custom,
  labels,
  ...UXTXOptions
};

module.exports = {
  TxManager,
  TxManagerOptions,
}

