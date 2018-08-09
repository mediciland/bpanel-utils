const moment = require('moment');
const assert = require('bsert');

const { Amount, TX } = require('bcoin');

// TODO: rename this.getJSON to
// this.getTXJSON
// TODO: value to BTC, prepend + or -

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
    this._counterparty = null;
    this._recipients = null;

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
    if (this._UXType)
      return this._UXType;

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
  // TODO: parse accounts
  /*
  accounts = knownOutputs
    .reduce((a, o) => ([...a, { name: o.name, account: o.account } ]), []);
  */

  getCounterparty() {
    let counterparty;
    let recipients;

    const copy = this.getCopy();
    const json = this.getJSON();

    switch(this.getUXType()) {
      case this.TYPES.deposit: // receive transaction
        // parse counterparty
        console.log('deposit')
        if (json.inputs.length > 1)
          counterparty = copy.MULTIPLE_ADDRESS_COPY;
        else if (json.inputs.length === 1)
          counterparty = json.inputs[0].address;
        else
          counterparty = copy.UNNOWN_ADDRESS_COPY;

        // parse recipients
        // TODO: catch edge cases here around more complex txns
        recipients = json.inputs.map(i => i.address)

        break;
      case this.TYPES.withdraw: // send transaction
        // parse recipients
        recipients = json.outputs
          .filter(o => {
            // only will have path property
            // if controlled by wallet
            if (o.path)
              return !o.path.change;
              // handle sending to controlled wallet

            return true; // all remaining outputs included
          })
          .map(o => o.address);
        // NOTE: if need more information about
        // coin, remove map above

        // parse counterpary based on number of recipients
        if (recipients.length === 1)
          counterparty = recipients[0];
        else if (recipients.length > 1)
          counterparty = copy.MULTIPLE_ADDRESS_COPY;
        else
          counterparty = copy.UNKNOWN_ADDRESS_COPY;

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

    this._counterparty = counterparty;
    this._recipients = recipients;

    return counterparty;
  }

  // TODO: implement
  getRecipients() {
    if (this._recipients)
      return this._recipients;

    return []
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
    // parse accounts
    const account = this.getAccount();
    const recipientCopy = this.getCounterparty();
    const recipients = this.getRecipients();

    // TODO: parse account copy from constants
    return {
      date,
      amount,
      wallet,  // must be provided by fn consumer
      account,
      confirmations: json.confirmations,
      recipients,
      recipientCopy, // counterparty
      accountCopy: 'TODO',
      uxtype: 'TODO',
    };
  }
}

module.exports = TXUX;

