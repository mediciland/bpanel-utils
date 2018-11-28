const { Amount } = require('hsd');

const pkgs = {
  handshake: require('hsd/lib/pkg'),
  bitcoin: require('bcoin/lib/pkg'),
  bitcoincash: require('bcash/lib/pkg'),
};

const assert = require('bsert');

const { isChainSupported } = require('./chain');

export const CURRENCY_UNITS = {
  bitcoin: {
    currency: pkgs.bitcoin.currency,
    unit: pkgs.bitcoin.unit,
    milli: `m${pkgs.bitcoin.unit}`,
    micro: 'bit',
    base: pkgs.bitcoin.base,
    ticker: pkgs.bitcoin.unit.toUpperCase(),
  },
  handshake: {
    currency: pkgs.handshake.currency,
    unit: pkgs.handshake.unit,
    milli: `m${pkgs.handshake.unit}`,
    micro: `u${pkgs.handshake.unit}`,
    base: pkgs.handshake.base,
    ticker: pkgs.handshake.unit.toUpperCase(),
  },
  bitcoincash: {
    currency: pkgs.bitcoincash.currency,
    unit: pkgs.bitcoincash.unit,
    milli: `m${pkgs.bitcoincash.unit}`,
    micro: 'bit',
    base: pkgs.bitcoincash.base,
    ticker: pkgs.bitcoincash.unit.toUpperCase(),
  },
};

export const CURRENCY_TYPES = {
  currency: 'currency',
  unit: 'unit',
  milli: 'milli',
  micro: 'micro',
  base: 'base',
  ticker: 'ticker',
};

export const CHAIN_EXP = {
  bitcoin: 8,
  bitcoincash: 8,
  handshake: 6,
}

class Currency extends Amount {
  /**
   * Create an object for getting currency units and amounts
   * @constructor
   * @param {string} chain - one of supported chain types
   * see {@link module:chain.CHAINS}
   * @param {(String|Number)?} value
   * @param {String?} unit
   * @returns {Currency}
   */
  constructor(chain, value, unit) {
    super(value, unit);
    const options = new CurrencyOptions(chain);
    this.chain = options.chain;
    this.units = options.units;
    this.exp = CHAIN_EXP[this.chain];
  }

  /**
   * Get actual unit string
   * @param {string} unit - one of supported unit types
   * returns {string}
   */
  getUnit(unit) {
    assert(CURRENCY_TYPES[unit], `${unit} not a supported unit type`);
    return this.units[unit];
  }

  /**
   * Get unit string or value.
   * Overwrites hsd's Amount for more generalized API
   * @param {String} unit
   * @param {Boolean?} num
   * @returns {String|Amount}
   */

  to(unit, num) {
    const types = CURRENCY_TYPES;
    switch (unit) {
      case types.base:
        return this.toBase(num);
      case types.micro:
      case 'bits':
        return this.toBits(num);
      case types.milli:
        return this.toMilli(num);
      case types.currency:
      case types.unit:
        return this.toCoins(num);
    }
    throw new Error(`Unknown unit "${unit}".`);
  }

  /**
   * Inject properties from unit.
   * @private
   * @param {String} unit
   * @param {Number|String} value
   * @returns {Amount}
   */

  from(unit, value) {
    const types = CURRENCY_TYPES;
    switch (unit) {
      case types.base:
        return this.fromBase(value);
      case types.micro:
      case 'bits':
        return this.fromBits(value);
      case types.milli:
        return this.fromMilli(value);
      case types.currency:
      case types.unit:
        return this.fromCoins(value);
    }
    throw new Error(`Unknown unit "${unit}".`);
  }

  /**
   * Get amount string with label
   * @param {String} unit
   * @param {Boolean?} num
   * @returns {String}
   */

  withLabel(unit, num) {
    return `${this.to(unit, num)} ${this.getUnit(unit)}`;
  }

  /**
   * Instantiate amount from unit.
   * @param {String} unit
   * @param {Number|String} value
   * @returns {Amount}
   */

  static from(chain, unit, value) {
    return new this(chain).from(unit, value);
  }

  /**
   * The remaining methods overwrite methods
   * from the Amount class this inherits from
   * in order ot account for different unit exponents
   * by chain
   */

  /**
   * Inject properties from value.
   * @private
   * @param {Number|String} value
   * @returns {Amount}
   */

  fromCoins(value) {
    this.value = Amount.decode(value, this.exp);
    return this;
  }

  /**
   * Get currency string or value.
   * @param {Boolean?} num
   * @returns {String|Amount}
   */

  toCoins(num) {
    return Amount.encode(this.value, this.exp, num);
  }

  /**
   * Get milli unit string or value.
   * encoded with exponent of 3 less than
   * largest unit (i.e. a "coin")
   * @param {Boolean?} num
   * @returns {String|Amount}
   */

  toMilli(num) {
    const milliExp = this.exp - 3;
    return Amount.encode(this.value, milliExp, num);
  }

  /**
   * Inject properties from milli unit of currency.
   * encoded with exponent of 3 less than
   * largest unit (i.e. a "coin")
   * @private
   * @param {Number|String} value
   * @returns {Amount}
   */

  fromMilli(value) {
    const milliExp = this.exp - 3;
    this.value = Amount.decode(value, milliExp);
    return this;
  }
}

class CurrencyOptions {
  constructor(chain) {
    assert(chain, 'must pass a chain to create Currency object');
    assert(isChainSupported(chain), `${chain} is not a supported chain`);
    this.chain = chain;
    this.units = CURRENCY_UNITS[this.chain];
    return this;
  }
}

export default Currency;
