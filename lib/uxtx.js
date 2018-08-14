const moment = require('moment');
const assert = require('bsert');

const { Amount, TX } = require('bcoin');

// TODO: rename this.getJSON to
// this.getTXJSON

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
    this._accounts = null;
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
    if (options.wallet) {
      assert(typeof options.wallet === 'string');
      this._wallet = options.wallet;
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

    return false;
  }

  // type can be input, outputs
  // undefined means both
  // TODO: cache and partially cache
  // TODO: replace string input with enum
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
    let prefix = '';
    switch(this.getUXType()) {
      case this.TYPES.DEPOSIT:
        coins = this.getKnownCoins('outputs')
        prefix = '+';
        break;
      case this.TYPES.WITHDRAW:
        coins = this.getKnownCoins('inputs');
        prefix = '-';
        break;
      case this.TYPES.COINBASE:
        coins = this.getJSON().outputs;
        prefix = '+';
        break;
      case this.TYPES.UNKNOWN:
      default:
        // something went wrong...
        coins = [];
    }

    const value = coins.reduce((a, c) => a + c.value, 0);
    const amount = new Amount(value, 'sat');

    return `${prefix}${amount.to(unit)}`;
  }

  getJSON() {
    assert(this._json);
    return this._json;
  }

  getWallet() {
    return this._wallet;
  }

  // TODO: move out of getCounterparty()
  getAccounts() {
    return this._accounts;
  }

  // TODO: reuse some of getCounterparty
  getAccount() {
    if (this._account)
      return this._account;

    let account;
    let knownOutputs = this.getKnownCoins('outputs');
    const knownInputs = this.getKnownCoins('inputs');
    const json = this.getJSON();
    const labels = this.getLabels();

    switch(this.getUXType()) {
      case this.TYPES.DEPOSIT:
        // account that received coin

        if (knownOutputs.length > 1)
          account = labels.MULTIPLE_ACCOUNT;
        else if (knownOutputs.length === 1)
          account = knownOutputs[0].path.name;
        else
          account = labels.UNKNOWN_ACCOUNT;

        break;
      case this.TYPES.WITHDRAW:
        // account sending coin

        if (knownInputs.length > 1)
          account = labels.MULTIPLE_ACCOUNT;
        else if (knownInputs.length === 1)
          account = knownInputs[0].path.name;
        else
          account = labels.UNKNOWN_ACCOUNT;

        break;
      case this.TYPES.COINBASE:
        // account that received coin

        // look before you leap
        if (json.outputs.length === 1 && json.outputs[0].path)
          account = json.outputs[0].path.name;
        else
          account = labels.UNKNOWN_ACCOUNT;

        break;
      case this.TYPES.UNKNOWN:
      default:
        account = labels.UNKNOWN_ACCOUNT;

        break;
    }

    this._account = account;
    return account
  }

  getUXType() {
    if (this._UXType)
      return this._UXType;

    let UXType;
    if (this.isCoinbase())
      UXType = this.TYPES.COINBASE;

    else if (this.isDeposit())
      UXType = this.TYPES.DEPOSIT;

    else if (this.isWithdraw())
      UXType = this.TYPES.WITHDRAW;

    else
      UXType = this.TYPES.UNKNOWN;

    this._UXType = UXType;
    return UXType;

  }

  /*
  accounts = knownOutputs
    .reduce((a, o) => ([...a, { name: o.name, account: o.account } ]), []);
  */

  // TODO: move accounts parsing out of this
  getCounterparty() {
    let counterparty;
    let recipients;
    let accounts;

    const labels = this.getLabels();
    const json = this.getJSON();

    switch(this.getUXType()) {
      case this.TYPES.DEPOSIT: // receive transaction
        // parse counterparty
        if (json.inputs.length > 1)
          counterparty = labels.MULTIPLE_ADDRESS;
        else if (json.inputs.length === 1)
          counterparty = json.inputs[0].address;
          // TODO: this can be a null value
        else
          counterparty = labels.UNKNOWN_ADDRESS;

        // parse recipients
        // TODO: catch edge cases here around more complex txns
        recipients = json.inputs.map(i => i.address)
        accounts = this.getKnownCoins('inputs')
          .filter(i => !i.path.change) // filter out change utxo
          .map(i => i.path.name)

        break;
      case this.TYPES.WITHDRAW: // send transaction
        // parse recipients
        const outputs= json.outputs
          .filter(o => {
            // only will have path property
            // if controlled by wallet
            if (o.path)
              return !o.path.change;
              // handle sending to controlled wallet

            return true; // all remaining outputs included
          })

        recipients = outputs.map(o => o.address);

        accounts = outputs.map(o => {
          if (o.path)  // known outputs will have an account name
            return o.path.name;
          return null;
        });

        // parse counterpary based on number of recipients
        if (recipients.length === 1)
          counterparty = recipients[0];
        else if (recipients.length > 1)
          counterparty = labels.MULTIPLE_ADDRESS;
        else
          counterparty = labels.UNKNOWN_ADDRESS;

        break;
      case this.TYPES.COINBASE:
        // assume one input and one output
        counterparty = json.outputs[0].address;
        recipients = [json.outputs[0].address];

        if (json.outputs[0].path)
          accounts = [json.outputs[0].path.name];

        break;
      case this.TYPES.UNKNOWN:
      default:
        counterparty = labels.UNKNOWN_ADDRESS;
        recipients = [];
        accounts = []
    }

    // TODO: break this parsing into multiple functions
    this._counterparty = counterparty;
    this._recipients = recipients;
    this._accounts = accounts;

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
    return this._labels;
  }

  static fromRaw(data, enc, options) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this(options).fromRaw(data);
  }

  toJSON() {
    const json = this.getJSON();
    const date = moment(json.date)
      .format(this.DATE_FORMAT);

    const uxtype = this.getUXType();
    const counterparty = this.getCounterparty();
    const recipients = this.getRecipients();
    const accounts = this.getAccounts();

    const wallet = this.getWallet();
    const amount = this.getAmount();

    const account = this.getAccount();
    const uxtypeLabel = this.getLabels(uxtype);

    const isSegwit = this.hasWitness();
    const weight = this.getWeight();

    // TODO: consolidate output values to make most flexible
    return {
      hash: json.hash,
      fee: json.fee,
      rate: json.rate,
      size: json.size,
      block: json.block,
      isSegwit,
      tx: json.tx,
      height: json.height,
      weight,
      date,
      amount,
      wallet,  // must be provided by fn consumer
      accounts,
      accountLabel: account,
      confirmations: json.confirmations,
      recipients,
      addressLabel: counterparty,
      uxtype: uxtypeLabel,
    };
  }
}

export default TXUX;

