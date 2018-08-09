const assert = require('bsert');
const moment = require('moment');

const { Amount } = require('bcoin');

class TxnManager {
  constructor(options) {
    // transactions from bcoin api
    // hash -> transaction json
    this.json = {};

    // custom transaction parsing
    // hash -> parsed transaction json
    this.parsed = {};

    if (options)
      this.fromOptions(options);
  }

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  fromOptions(options) {
    if (options.custom) {
      assert(typeof options.custom === 'function');
      this.custom = options.custom;
    }

    if (options.constants) {
      // TODO: validation
      this.constants = options.constants;
    }

    return this;
  }

  /**
   * Clear any cached values.
   */

  refresh() {
    this.json = {};
    this.parsed = {};
  }

  // bust - bool
  // update api to allow for list of txns to bust
  // TODO: value to BTC, prepend + or -
  parse(transactions, wallet = null, bust = false) {

    // use custom parsing function
    if (this.custom)
      return this.custom(transactions, wallet, bust);

    return transactions.map(txn => {

      const { constants } = this;

      // no global bust and the transaction is parsed
      if (bust === false && txn.hash in this.parsed)
        return this.parsed[txn.hash];

      const d = {};
      // format date
      d.Date = moment(txn.date)
        .format(constants.DATE_FORMAT);

      // TODO: be certain this works with tx indexing on
      const knownInputs = txn.inputs.filter(i => i.path);
      const knownOutputs = txn.outputs.filter(o => o.path);

      let sendOrReceive; // string
      let recipient; // string
      let batchedOutput = false; // indicates multiple outputs
      let account; // string

      /*
       * withdrawal defined by:
       * more than 1 known input
       * more than 1 change output
       * TODO: not all withdrawals have change
       */
      const changeOutputs = knownOutputs.filter(o => o.path.change);
      if (knownInputs.length > 0 && changeOutputs.length > 0)
        sendOrReceive = constants.SEND;

      /*
       * deposit defined by:
       * no known inputs
       * no change outputs
       */
      if (knownInputs.length === 0 && changeOutputs.length === 0)
        sendOrReceive = constants.RECEIVE;

      /*
       * coinbase defined by:
       * input length is 1
       * input address is null
       * TODO: this could overwrite a normal receive
       */
      if (txn.inputs.length === 1 && txn.inputs[0].address === null)
        sendOrReceive = constants.COINBASE_RECEIVE;

      // sanity check
      if (sendOrReceive === undefined)
        console.warn(`BUG: problem parsing ${txn.hash}`);

      let recipients; // list of addresses
      let counterparty; // opposite side of txn
      let amount; // value transferred to/from control
      let accounts = []; // list of accounts participating in txn

      if (sendOrReceive === constants.SEND) {
        // filter out change txns
        recipients = knownOutputs.filter(o => {
          if (o.path) // only will have path property if controlled by wallet
            return !o.path.change; // handle sending to controlled wallet
          return true; // all remaining outputs included
        });

        // parse counterpary based on number of recipients
        if (recipients.length === 0)
          counterparty = constants.UNKNOWN_ADDRESS_COPY;
        else if (recipients.length > 1)
          counterparty = constants.MULTIPLE_ADDRESS_COPY;
        else
          counterparty = recipients[0].address;

        // sum of inputs under control
        amount = knownInputs.reduce((a, i) => a + i.value, 0);

        // list of accounts under control
        accounts = knownInputs.reduce((a, i) => ([...a, { name: i.name, account: i.account } ]), []);

      } else if (sendOrReceive === constants.RECEIVE) {

        // hopefully only 1 transaction input
        if (txn.inputs.length > 1)
          counterparty = constants.UNKNOWN_ADDRESS_COPY; // coinjoin?
        else if (txn.inputs.length === 1)
          counterparty = txn.inputs[0].address;
        else
          console.warn('BUG: no counterparty address parsed');

        // TODO: make sure this works with txn indexing on
        recipients = knownOutputs;
        amount = knownOutputs.reduce((a, o) => a + o.value, 0);

        // list of accounts deposited to
        accounts = knownOutputs
          .reduce((a, o) => ([...a, { name: o.name, account: o.account } ]), []);

      } else if (sendOrReceive === constants.COINBASE_RECEIVE) {

        // assume one input, one output for coinbase txn
        counterparty = txn.outputs[0].address;
        amount = txn.outputs[0].value;
        recipients = [txn.outputs[0].address]

        // list of accounts deposited to
        accounts = knownOutputs
          .reduce((a, o) => ([...a, { name: o.name, account: o.account } ]), []);
      }

      // TODO: similar code above
      if (accounts.length > 1)
        account = constants.MULTIPLE_ACCOUNT_COPY;
      else if (accounts.length === 1)
        account = accounts[0].name;
      else
        account = constants.UNKNOWN_ACCOUNT_COPY;

      // parse amount to bitcoin unit

      d.Amount = amount;
      d.Wallet = wallet; // must be provided by consumer of function
      d.Account = account;
      d.Confirmations = txn.confirmations; // TODO: pretty parse this
      d['Send/Receive'] = sendOrReceive;
      d.Recipient = counterparty;

      this.parsed[txn.hash] = d;
      this.json[txn.hash] = txn;

      return d;
    });
  }
}

// initial values
const constants = {
  DATE_FORMAT: 'MM/DD/YY hh:mm a',
  SEND: 'Sent',
  RECEIVE: 'Received',
  COINBASE_RECEIVE: 'Coinbase',
  MULTIPLE_OUTPUT_COPY: 'Multiple',
  UNKNOWN_ADDRESS_COPY: 'Unknown',
};

module.exports = {
  TxnManager,
  options: {
    constants,
    custom: null,
  }
}
