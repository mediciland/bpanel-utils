const assert = require('bsert');
import TXUX from './uxtx.js';

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

  // TODO: jsdoc explaining arguments here
  fromOptions(options) {
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

  // bust - bool
  // update api to allow for list of txns to bust
  parse(transactions, wallet = null, bust = false) {
    // use custom parsing function
    if (this._custom)
      return this._custom(transactions, wallet, bust);

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
        copy: constants,
        json: txn,
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
const labels = {
  WITHDRAW: 'Sent',
  DEPOSIT: 'Received',
  COINBASE: 'Coinbase',
  MULTIPLE_OUTPUT_COPY: 'Multiple',
  UNKNOWN_ADDRESS_COPY: 'Unknown',
};
// initial null custom parsing function
const custom = null;
// initial constants
const constants = {
  DATE_FORMAT: 'MM/DD/YY hh:mm a',
};
// initial options
// TODO: turn into class
const TxnManagerOptions = {
  labels,
  custom,
  constants,
}

module.exports = {
  TxnManager,
  TxnManagerOptions,
}

