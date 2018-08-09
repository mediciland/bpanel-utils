const assert = require('bsert');
const moment = require('moment');

const { Amount, TX } = require('bcoin');

// DATE_FORMAT: 'MM/DD/YY hh:mm a',
// SEND: 'Sent',
// RECEIVE: 'Received',
// COINBASE_RECEIVE: 'Coinbase',
// MULTIPLE_OUTPUT_COPY: 'Multiple',
// UNKNOWN_ADDRESS_COPY: 'Unknown',


// TODO: rename this.getJSON to
// this.getTXJSON

class TXUX extends TX {
  constructor(options) {
    super();

    this.TYPES = {
      coinbase: 'coinbase',
      withdraw: 'withdraw',
      deposit: 'deposit',
      unknown: 'unknown'
    }

    this.dateFormat = null;
    this._UXType = null;
    this._copy = null;
    this._json = null;
    this._wallet = null;
    this._account = null;

    if (options)
      this.fromOptions(options);
  }

  fromOptions(options) {
    if (options.dateFormat) {
      assert(typeof options.dateFormat === 'string');
      // TODO: figure out correct date format string
      //assert(moment(options.dateFormat).isValid());
      this.dateFormat = options.dateFormat;
    }
    if (options.copy) {
      assert(typeof options.copy === 'object');
      for (let [key, val] of Object.entries(options.copy))
        assert(typeof val === 'string');
      this._copy = options.copy;
    }
    if (options.json) {
      assert(typeof options.json === 'object');
      this._json = options.json;
    }

    return this;
  }

  /*
   * withdrawal defined by:
   * more than 1 known input
   * at least 1 change output
   * TODO: not all withdrawals have change
   */
  isWithdraw() {
    const json = this.getJSON();

    const knownOutputs = this.getKnownCoins('outputs');
    const knownInputs = this.getKnownCoins('inputs');
    const changeOutputs = this.getChangeCoins(knownOutputs);

    if (knownInputs.length > 0 && changeOutputs.length > 0)
      return true;
      //sendOrReceive = constants.SEND;

    return false;
  }


  /*
   * deposit defined by:
   * no known inputs
   * no change outputs
   */
  isDeposit() {
    const json = this.getJSON();
    const knownInputs = this.getKnownCoins('inputs');
    const changeOutputs = this.getChangeCoins(json.outputs);

    if (knownInputs.length === 0 && changeOutputs.length === 0)
      return true;
      //sendOrReceive = constants.RECEIVE;

    return false;
  }

  // type can be input, outputs
  // undefined means both
  // TODO: cache and partially cache
  getKnownCoins(type) {
    const json = this.getJSON();

    if (type === 'inputs')
      return json.inputs.filter(i => i.path);
    if (type === 'outputs')
      return json.outputs.filter(o => o.path);

    return [
      ...json.inputs.filter(i => i.path),
      ...json.outputs.filter(o => o.path),
    ]
  }

  // Method for non change coins?
  getChangeCoins(coins) {
    return coins.filter(o => o.path && o.path.change);
  }

  getAmount(unit = 'btc') {
    let coins;
    switch(this.getUXType()) {
      case this.TYPES.deposit:
        coins = this.getKnownCoins('outputs')
        break;
      case this.TYPES.withdraw:
        coins = this.getKnownCoins('inputs');
        break;
      case this.TYPES.coinbase:
        coins = this.getJSON().inputs;
        break;
      case this.TYPES.unknown:
      default:
        // something went wrong...
        coins = [];
    }

    const value = coins.reduce((a, c) => a + c.value, 0);
    const amount = new Amount(value, 'sat');

    return amount.to(unit);
  }

  getJSON() {
    assert(this._json);
    return this._json;
  }

  // not required, no validation
  getWallet() {
    return this._wallet;
  }
  // not required, no validation
  getAccount() {
    return this._account;
  }

  getUXType() {
    if (this.UXType)
      return this.UXType;

    let UXType;
    if (this.isDeposit())
      UXType = this.TYPES.deposit;

    else if (this.isWithdraw())
      UXType = this.TYPES.withdraw;

    else if (this.isCoinbase())
      UXType = this.TYPES.coinbase;

    else
      UXType = this.TYPES.unknown;

    this._UXType = UXType;
    return UXType;

  }

  // TODO: remove COPY suffix if in copy object

  getCounterparty() {
    let counterparty;
    let recipients;

    const copy = this.getCopy();
    const json = this.getJSON();

    switch(this.getUXType()) {
      case this.TYPES.deposit:
        // TODO: parse recipients
        if (json.inputs.length > 1)
          counterparty = copy.MULTIPLE_ADDRESS_COPY;
        else if (json.inputs.length === 1)
          counterparty = json.inputs[0].address;
        else
          counterparty = copy.UNNOWN_ADDRESS_COPY;

        break;
      case this.TYPES.withdraw:
        recipients = this.getKnownCoins('outputs')
          .filter(o => {
            // only will have path property
            // if controlled by wallet
            if (o.path)
              return !o.path.change;
              // handle sending to controlled wallet

            return true; // all remaining outputs included
          });

        // parse counterpary based on number of recipients
        // should never hit first case
        // TODO: refactor order based on this
        if (recipients.length === 0)
          counterparty = copy.UNKNOWN_ADDRESS_COPY;
        else if (recipients.length > 1)
          counterparty = copy.MULTIPLE_ADDRESS_COPY;
        else
          counterparty = recipients[0].address;

        break;
      case this.TYPES.coinbase:
        // assume one input and one output
        counterparty = json.outputs[0].address;
        recipients = [json.outputs[0].address];

        break;
      case this.TYPES.unknown:
      default:
        counterparty = copy.UNKNOWN_ADDRESS_COPY;
        recipients = [];
    }

    return counterparty;

  }

  getCopy(copy) {
    if (copy)
      return this._copy[copy];
    return this._copy;
  }

  static fromRaw(data, enc, options) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this(options).fromRaw(data);
  }

  toJSON() {
    // TODO: anything useful in super.toJSON?
    //const json = super.toJSON(true);
    const json = this.getJSON();
    const date = moment(json.date)
      .format(this.dateFormat);
    const amount = this.getAmount();
    const wallet = this.getWallet();
    const account = this.getAccount();
    const recipient = this.getCounterparty();

    return {
      date,
      amount,
      wallet,
      account,
      confirmations: json.confirmations,
      recipient,
    };
  }
}


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
  // TODO: _ prefix
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

    const { constants } = this;
    return transactions.map(txn => {

      const txux = TXUX.fromRaw(txn.tx, 'hex', { dateFormat: constants.dateFormat, copy: constants, json: txn });

      console.log(`txux.toJSON: ${JSON.stringify(txux.toJSON(), null, 2)}`);
      // no global bust and the transaction is parsed
      if (bust === false && txn.hash in this.parsed)
        return this.parsed[txn.hash];

      // replace d to txux.toJSON()
      const d = {};

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

      console.log(d)
      return d;
    });
  }
}

// initial values
const constants = {
  DATE_FORMAT: 'MM/DD/YY hh:mm a',
  dateFormat: 'MM/DD/YY hh:mm a',
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
