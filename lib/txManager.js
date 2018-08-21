const assert = require('bsert');
import { UXTX } from './uxtx.js';

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

    return this;
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
   * @param {Object} UXTXOpts
   * @param {String|null} UXTXOpts.wallet
   * @param {Boolen} bust - bust the cache
   *
   * User can call more than once for transactions
   * from different wallets
   */
  parse(transactions, UXTXOpts, bust = false) {
    assert(Array.isArray(transactions), 'Must pass list of txs');
    assert(typeof UXTXOpts === 'object', 'Must pass UXTXOptions');
    // use custom parsing function
    if (this._custom) {
      const out = this._custom(transactions, UXTXOpts, bust);
      assert(Array.isArray(out), 'Must return list from custom tx parse function');
      return out;
    }

    return transactions.map(txn => {
      // no global bust and the transaction already parsed
      if (bust === false && txn.hash in this._parsed)
        return this._parsed[txn.hash];

      const options = {
        ...UXTXOpts,
        json: txn,
      };

      const uxtx = UXTX.fromRaw(txn.tx, 'hex', options);

      // cache output
      const json = uxtx.toJSON();
      this._parsed[txn.hash] = json;

      return json;
    });
  }
}

// initial null custom parsing function
const custom = null;

// initial options
// bundle together with UXTX opts
// so that TxManager can handle setting
// options of all txs it manages
const TxManagerOptions = {
  custom,
};

module.exports = {
  TxManager,
  TxManagerOptions,
}

