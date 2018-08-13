const moment = require('moment');
const assert = require('bsert');

const { Amount, TX } = require('bcoin');

// TODO: rename this.getJSON to
// this.getTXJSON
// TODO: value to BTC, prepend + or -


// bcoin api
// deposits:
// null path in the inputs
// output with path defined and change false
//
// withdrawals:
// input with defined path and change false
// output with path defined and change true

class TXUX extends TX {
  constructor(options) {
    super();

    // these are used as keys to look up
    // in options.labels for toJSON labels
    this.TYPES = {
      COINBASE: 'COINBASE',
      WITHDRAW: 'WITHDRAW',
      DEPOSIT: 'DEPOSIT',
      UNKNOWN: 'UNKNOWN',
    }
    // TODO: handle:
    // wallet/account -> same wallet/account
    // wallet/account -> same wallet/different account

    this.DATE_FORMAT = null;
    this._UXType = null;
    this._labels = null;
    this._json = null;
    this._wallet = null;
    this._account = null;
    this._counterparty = null;
    this._recipients = null;

    if (options)
      this.fromOptions(options);
  }

  fromOptions(options) {
    if (options.constants.DATE_FORMAT) {
      assert(typeof options.constants.DATE_FORMAT === 'string');
      // TODO: figure out correct date format string
      //assert(moment(options.constants.DATE_FORMAT).isValid());
      this.DATE_FORMAT = options.constants.DATE_FORMAT;
    }
    if (options.labels) {
      assert(typeof options.labels === 'object');
      for (let [key, val] of Object.entries(options.labels))
        assert(typeof val === 'string');
      this._labels = options.labels;
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
      case this.TYPES.DEPOSIT:
        coins = this.getKnownCoins('outputs')
        break;
      case this.TYPES.WITHDRAW:
        coins = this.getKnownCoins('inputs');
        break;
      case this.TYPES.COINBASE:
        coins = this.getJSON().inputs;
        break;
      case this.TYPES.UNKNOWN:
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
  // TODO: reuse some of getCounterparty
  getAccount() {
    return this._account;
  }

  getUXType() {
    if (this._UXType)
      return this._UXType;

    let UXType;
    if (this.isDeposit())
      UXType = this.TYPES.DEPOSIT;

    else if (this.isWithdraw())
      UXType = this.TYPES.WITHDRAW;

    else if (this.isCoinbase())
      UXType = this.TYPES.COINBASE;

    else
      UXType = this.TYPES.UNKNOWN;

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

    const labels = this.getLabels();
    const json = this.getJSON();

    switch(this.getUXType()) {
      case this.TYPES.DEPOSIT: // receive transaction
        // parse counterparty
        if (json.inputs.length > 1)
          counterparty = labels.MULTIPLE_ADDRESS_COPY;
        else if (json.inputs.length === 1)
          counterparty = json.inputs[0].address;
        else
          counterparty = labels.UNNOWN_ADDRESS_COPY;

        // parse recipients
        // TODO: catch edge cases here around more complex txns
        recipients = json.inputs.map(i => i.address)

        break;
      case this.TYPES.WITHDRAW: // send transaction
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
          counterparty = labels.MULTIPLE_ADDRESS_COPY;
        else
          counterparty = labels.UNKNOWN_ADDRESS_COPY;

        break;
      case this.TYPES.COINBASE:
        // assume one input and one output
        counterparty = json.outputs[0].address;
        recipients = [json.outputs[0].address];

        break;
      case this.TYPES.UNKNOWN:
      default:
        counterparty = labels.UNKNOWN_ADDRESS_COPY;
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

  getLabels(label) {
    if (label)
      return this._labels[label];
    return this._label;
  }

  static fromRaw(data, enc, options) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this(options).fromRaw(data);
  }

  toJSON() {
    // TODO: anything useful in super.toJSON?

    const json = this.getJSON();
    const date = moment(json.date)
      .format(this.DATE_FORMAT);
    const amount = this.getAmount();
    const wallet = this.getWallet();
    // parse accounts
    const account = this.getAccount();
    const recipientCopy = this.getCounterparty();
    const recipients = this.getRecipients();
    const uxtype = this.getUXType();
    const uxtypeLabel = this.getLabels(uxtype);

    // TODO: parse account label from labels
    return {
      date,
      amount,
      wallet,  // must be provided by fn consumer
      account,
      confirmations: json.confirmations,
      recipients,
      recipientCopy, // counterparty
      accountCopy: 'TODO',
      uxtype: uxtypeLabel,
    };
  }
}

export default TXUX;

