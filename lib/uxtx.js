const { Amount, TX } = require('bcoin');
const assert = require('bsert');
const moment = require('moment');

/**
 * User Experience Transaction
 * NOTE: this class is not meant to be mutable
 *
 * @alias module:bpanel-utils.UXTX
 * @extends TX
 */
class UXTX extends TX {
  /**
   * Create a UXTX
   * User Experience Transaction
   * @constructor
   * @param options
   *
   * TODO: handle these cases:
   * wallet/account -> same wallet/account
   * wallet/account -> same wallet/different account
   * coinjoin transactions
   *
   * TODO: overwrite TX.inspect
   */

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

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   * @param {Object} options.json - json encoded transaction
   * @param {Object} options.constants - for calculating human readable info
   * @param {Object} options.constants.DATE_FORMAT - moment.js date format string
   * @param {Object} options.labels - human readable labels
   * @param {String} options.wallet - wallet that the txs belong to
   */
  fromOptions(options) {
    assert(options.json, 'tx object is required');
    assert(typeof options.json === 'object', 'tx json must be an object');
    this._json = options.json;

    if (options.constants.DATE_FORMAT) {
      assert(typeof options.constants.DATE_FORMAT === 'string');
      this.DATE_FORMAT = options.constants.DATE_FORMAT;
    }

    if (options.labels) {
      assert(typeof options.labels === 'object');
      for (let [key, val] of Object.entries(options.labels))
        assert(typeof val === 'string');
      this._labels = options.labels;
    }

    if (options.wallet) {
      assert(typeof options.wallet === 'string');
      this._wallet = options.wallet;
    }

    return this;
  }

  /**
   * Return transaction user experience
   * types, these differentiate the
   * labels to be displayed to a user
   *
   * @returns {Object}
   */
  getTypes() {
    return this.TYPES;
  }

  /**
   * Attempt to calculate if transaction is
   * a withdrawal from a known account.
   * Withdrawal defined by:
   * more than 1 known input
   * at least 1 known change output
   *
   * NOTE: not all withdrawals should actually have change
   * but as of bcoin@1.0.2 they all do
   *
   * @returns {Boolean}
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
   * Attempt to calculate if transaction is
   * a deposit.
   * deposit defined by:
   * no known inputs
   * no change outputs
   * @returns {Boolean}
   */
  isDeposit() {
    const json = this.getJSON();
    const knownInputs = this.getKnownCoins('inputs');
    const changeOutputs = this.getChangeCoins(json.outputs);

    if (knownInputs.length === 0 && changeOutputs.length === 0)
      return true;

    return false;
  }

  /*
   * Get known coins
   * known coin defined by:
   * coin.path is not null
   * type can be inputs, outputs
   * undefined type gets both
   * @param {String} type
   * @returns {Boolean}
   *
   * TODO: cache and partially cache
   * TODO: replace string input with enum
   */
  getKnownCoins(type) {
    const json = this.getJSON();

    if (type === 'inputs')
      return json.inputs.filter(i => i.path);
    if (type === 'outputs')
      return json.outputs.filter(o => o.path);

    // destructuring into new array
    return [
      ...json.inputs.filter(i => i.path),
      ...json.outputs.filter(o => o.path),
    ];
  }

  /*
   * Get external coins
   * external coin defined by:
   * control by a private key
   * external of the consumer's wallet
   * @param {String} type
   * @returns {Boolean}
   *
   * TODO: implement
   * TODO: replace string input with enum
   */
  getExternalCoins(type) {
    throw new Error('Not Implemented Error');
  }

  /*
   * Get change coins
   * change coin defined by:
   * coin assigned to change address
   * @param {Object[]} coins
   * @param {Object} coins[].path
   * @param {Boolean} coins[].path.change
   * @returns {Object[]}
   */
  getChangeCoins(coins) {
    return coins.filter(o => o.path && o.path.change);
  }

  /*
   * Get value for inputs, outputs or both
   * Convert from satoshis to unit
   * see bcoin.Amount for accepted amounts
   * @param {String} type
   * @param {String} [unit='btc']
   * @returns {Number}
   */
  getAmount(type, unit = 'btc') {
    let coins;
    const json = this.getJSON();

    if (type === 'inputs')
      coins = json.inputs;

    else if (type === 'outputs')
      coins = json.outputs;

    else
      coins = [...json.inputs, ...json.outputs];

    const value = coins.reduce((a, o) => a + o.value, 0);
    let amount = new Amount(value, 'sat');
    return amount.to(unit);
  }

  /*
   * Get value from known coins
   * and return as string for pretty printing
   * Convert from satoshis to unit
   * see bcoin.Amount for accepted amounts
   * @param {String} [unit='btc']
   * @param {Boolean} [formatted=false] - add prefix '+'/'-'
   * @returns {String}
   */
  getKnownAmount(unit = 'btc', formatted = false) {
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
    let amount = new Amount(value, 'sat');
    amount = amount.to(unit);

    if (formatted)
      return `${prefix}${amount}`;

    return `${amount}`;
  }

  /*
   * Get bcoin.TX json
   * @returns {Object}
   *
   * TODO: rename this.getJSON to
   * this.getTXJSON
   */
  getJSON() {
    assert(this._json);
    return this._json;
  }

  /*
   * Get wallet name
   * @returns {String}
   */
  getWallet() {
    return this._wallet;
  }

  /*
   * Get account names
   * @returns {[]String}
   */
  getAccounts() {
    if (this._accounts)
      return this._accounts;

    let accounts;

    const labels = this.getLabels();
    const json = this.getJSON();

    switch(this.getUXType()) {
      case this.TYPES.DEPOSIT: // receive transaction

        accounts = this.getKnownCoins('inputs')
          .filter(i => !i.path.change) // filter out change utxo
          .map(i => i.path.name)

        break;
      case this.TYPES.WITHDRAW: // send transaction
        accounts = json.outputs
          .filter(o => {
            // only will have path property
            // if controlled by wallet
            if (o.path)
              return !o.path.change;
              // handle sending to controlled wallet
            return true; // all remaining outputs included
          })
          .map(o => {
            if (o.path)  // known outputs will have an account name
              return o.path.name;
            return null;
          });

        break;
      case this.TYPES.COINBASE:
        // null account when not controlled wallet
        if (json.outputs[0].path)
          accounts = [json.outputs[0].path.name];
        else
          accounts = [null];

        break;
      case this.TYPES.UNKNOWN:
      default:
        accounts = []
    }

    this._accounts = accounts;
    return accounts;
  }


  /*
   * Get displayed account name
   * @returns {String}
   */
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

  /*
   * Get tx user experience type
   * Determines which human readable labels
   * are parsed
   * @returns {String}
   */
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
   * Get tx counterparty
   * @returns {String}
   *
   * TODO: move accounts parsing out of this
   * and into this.getAccounts
   *
   * TODO: move recipients parsing out of this
   * and into this.getRecipients
   */
  getCounterparty() {
    let counterparty;
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

        break;
      case this.TYPES.WITHDRAW: // send transaction
        // TODO: remove concept of recipients
        const outputs= json.outputs
          .filter(o => {
            // only will have path property
            // if controlled by wallet
            if (o.path)
              return !o.path.change;
              // handle sending to controlled wallet

            return true; // all remaining outputs included
          });
        const recipients = outputs.map(o => o.address);

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

        break;
      case this.TYPES.UNKNOWN:
      default:
        counterparty = labels.UNKNOWN_ADDRESS;
    }

    this._counterparty = counterparty;
    return counterparty;
  }

  /*
   * Get tx recipients
   * @returns {String}
   */
  getRecipients() {
    if (this._recipients)
      return this._recipients;

    let recipients;

    const labels = this.getLabels();
    const json = this.getJSON();

    switch(this.getUXType()) {
      case this.TYPES.DEPOSIT: // receive transaction
        // parse recipients
        // TODO: catch edge cases here around more complex txns
        recipients = json.inputs.map(i => i.address)

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
          .map(o => o.address);

        break;
      case this.TYPES.COINBASE:
        // assume one input and one output
        recipients = [json.outputs[0].address];

        break;
      case this.TYPES.UNKNOWN:
      default:
        recipients = [];
    }

    this._recipients = recipients;
    return recipients;
  }

  /*
   * Get human readable labels
   * These can be configured with this.fromOptions
   * @param {String} label - return a specific labels value
   * @returns {Object|String}
   */
  getLabels(label) {
    if (label)
      return this._labels[label];
    return this._labels;
  }

  /*
   * Get human readable labels
   * These can be configured with this.fromOptions
   * @static
   * @param {String|Buffer} data - raw tx data
   * @param {String} enc - encoding raw tx data is in
   * @param {Objects} options - UXTX options
   * @returns {Object|String}
   */
  static fromRaw(data, enc, options) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this(options).fromRaw(data);
  }

  /*
   * Get JSON with human readable values in it
   * @returns {Object}
   *
   * TODO: consolidate output values to make most flexible
   * TODO: don't hardcode segwit and coinbase labels
   */
  toJSON() {
    const json = this.getJSON();
    const date = moment(json.date)
      .format(this.DATE_FORMAT);

    const uxtype = this.getUXType();
    const counterparty = this.getCounterparty();
    const recipients = this.getRecipients();
    const accounts = this.getAccounts();

    const wallet = this.getWallet();
    const amount = this.getKnownAmount('btc', true);

    const account = this.getAccount();
    const uxtypeLabel = this.getLabels(uxtype);

    const isSegwit = this.hasWitness();
    const isCoinbase = this.isCoinbase();
    const weight = this.getWeight();

    const inputAmount = this.getAmount('inputs');
    const outputAmount = this.getAmount('outputs');

    return {
      hash: json.hash,
      fee: json.fee,
      rate: json.rate,
      size: json.size,
      block: json.block,
      isSegwit,
      isCoinbase,
      tx: json.tx,
      height: json.height,
      inputs: json.inputs,
      outputs: json.outputs,
      inputAmount,
      outputAmount,
      weight,
      date,
      amount,
      wallet,  // must be provided by fn consumer
      accounts,
      confirmations: json.confirmations,
      recipients,
      addressLabel: counterparty,
      accountLabel: account,
      segwitLabel: isSegwit ? 'Yes' : 'No',
      coinbaseLabel: isCoinbase ? 'Yes' : 'No',
      uxtype: uxtypeLabel,
    };
  }
}

export default UXTX;

