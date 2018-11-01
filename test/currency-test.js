import { assert } from 'chai';
import Currency, {
  CURRENCY_TYPES,
  CURRENCY_UNITS,
  CHAIN_EXP,
} from '../lib/currency';
import { Amount, pkg } from 'hsd';

describe('Currency', () => {
  let bitcoin, bitcoinCash, handshake, baseAmt;
  beforeEach(() => {
    baseAmt = 5;
    bitcoin = new Currency('bitcoin', 5);
    bitcoinCash = new Currency('bitcoincash', 5);
    handshake = new Currency('handshake', 5);
  });

  it('should be an instance of HSD Amount class', () => {
    assert.instanceOf(handshake, Amount);
    assert.instanceOf(bitcoin, Amount);
    assert.instanceOf(bitcoinCash, Amount);
  });

  it('should return matching units for Handshake', () => {
    assert.equal(handshake.getUnit(CURRENCY_TYPES.base), pkg.base);
    assert.equal(handshake.getUnit(CURRENCY_TYPES.micro), `u${pkg.unit}`);
    assert.equal(handshake.getUnit(CURRENCY_TYPES.milli), `m${pkg.unit}`);
    assert.equal(handshake.getUnit(CURRENCY_TYPES.unit), pkg.unit);
    assert.equal(handshake.getUnit(CURRENCY_TYPES.currency), pkg.currency);
  });

  it('should return correct units for Bitcoin and Bitcoin Cash', () => {
    const currencies = [bitcoin, bitcoinCash];
    currencies.forEach(currency => {
      assert.equal(currency.getUnit(CURRENCY_TYPES.base), 'satoshi');
      assert.equal(currency.getUnit(CURRENCY_TYPES.micro), 'bit');
      assert.equal(currency.getUnit(CURRENCY_TYPES.milli), 'mbtc');
      assert.equal(currency.getUnit(CURRENCY_TYPES.unit), 'btc');
      assert.equal(currency.getUnit(CURRENCY_TYPES.currency), 'bitcoin');
    });
  });

  it('should convert to correct milli units', () => {
    const bitcoinExp = CHAIN_EXP['bitcoin'] - 3;
    const hnsExp = CHAIN_EXP['handshake'] - 3;
    assert.equal(
      bitcoin.toMilli(true),
      Currency.encode(baseAmt, bitcoinExp, true),
      'Problem with `toMilli` for bitcoin'
    );
    assert.equal(
      bitcoinCash.toMilli(true),
      Currency.encode(baseAmt, bitcoinExp, true),
      'Problem with `toMilli` for bitcoinCash'
    );
    assert.equal(
      handshake.toMilli(true),
      Currency.encode(baseAmt, hnsExp, true),
      'Problem with `toMilli` for handshake'
    );
  });

  it('should convert values to and from the correct units', () => {
    const currencies = Object.keys(CURRENCY_UNITS);
    const coins = { bitcoin, handshake, bitcoinCash };
    for (let currency of currencies) {
      for (let type in CURRENCY_TYPES) {
        const val = Currency.from(currency, CURRENCY_TYPES[type], baseAmt);
        assert.equal(
          val.to(CURRENCY_TYPES[type], true),
          coins['handshake'].toBase(true),
          `Problem with ${type}`
        );
      }
    }
  });

  it('should throw on unknown chain', () => {
    const createUnknownCurrency = () => new Currency('foobar');
    assert.throws(createUnknownCurrency);
  });
});
