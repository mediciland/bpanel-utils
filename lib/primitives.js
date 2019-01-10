import assert from 'bsert';

/*
 * manages mappings between primitives
 * such that applications can live switch between
 * different blockchains
 *
 */

import {
  MTX as bcoinMTX,
  TX as bcoinTX,
  KeyRing as bcoinKeyRing,
  Address as bcoinAddress,
  HDPublicKey as bcoinHDPublicKey,
} from 'bcoin';

import {
  MTX as bcashMTX,
  TX as bcashTX,
  KeyRing as bcashKeyRing,
  Address as bcashAddress,
  HDPublicKey as bcashHDPublicKey,
} from 'bcash';

import {
  MTX as hsdMTX,
  TX as hsdTX,
  KeyRing as hsdKeyRing,
  Address as hsdAddress,
  HDPublicKey as hsdHDPublicKey,
} from 'hsd';

/*
 * an object is created for each primitive
 * that is keyed by the name of the blockchain
 */

const MTX = {
  bitcoin: bcoinMTX,
  bitcoincash: bcashMTX,
  handshake: hsdMTX,
};

const TX = {
  bitcoin: bcoinTX,
  bitcoincash: bcashTX,
  handshake: hsdTX,
};

const Address = {
  bitcoin: bcoinAddress,
  bitcoincash: bcashAddress,
  handshake: hsdAddress,
};

const KeyRing = {
  bitcoin: bcoinKeyRing,
  bitcoincash: bcashKeyRing,
  handshake: hsdKeyRing,
};

const HDPublicKey = {
  bitcoin: bcoinHDPublicKey,
  bitcoincash: bcashHDPublicKey,
  handshake: hsdHDPublicKey,
};

// export an object of all
// of the primities
export const primitives = {
  HDPublicKey,
  MTX,
  TX,
  KeyRing,
  Address,
};

/*
 * create MTX object
 * @param {Object} tx
 * @param {Object} options
 * @param {String} options.type
 *   select how to instantiate primitive
 *   ie, fromRaw, fromJSON etc
 * @param {String} options.chain
 *   blockchain name
 */
export function toMTX(tx, options) {
  const { type, chain } = options;
  assert(type);
  assert(chain);

  switch (type) {
    case 'raw':
      return MTX[chain].fromRaw(tx.hex, 'hex');

    case 'json':
      return MTX[chain].fromJSON(tx);

    default:
      return null;
  }
}

/*
 * create TX object
 * @param {Object} tx
 * @param {Object} options
 * @param {String} options.type
 *   select how to instantiate primitive
 *   ie, fromRaw, fromJSON etc
 * @param {String} options.chain
 *   blockchain name
 */
export function toTX(tx, options) {
  const { type, chain } = options;
  assert(type);
  assert(chain);

  switch (type) {
    case 'raw':
      return TX[chain].fromRaw(tx.hex, 'hex');

    case 'json':
      return TX[chain].fromJSON(tx);

    case 'options':
      return TX[chain].fromOptions(tx);

    default:
      return null;
  }
}


/*
 * create Address object
 * @param {string} address
 * @param {Object} options
 * @param {String} options.type
 *   select how to instantiate primitive
 *   ie fromRaw, fromJSON etc
 * @param {String} options.chain
 *   blockchain name
 * @param {String} options.network
 *   blockchain network
 *   ie main, testnet, regtest
 */
export function toAddress(address, options) {
  const { type, chain, network } = options;

  switch (type) {
    case 'string':
      return Address[chain].fromString(address, network);

    case 'options':
      return Address[chain].fromOptions(options);

    default:
      return null;
  }
}


/*
 * create Keyring object
 * @param {string} key
 * @param {Object} options
 * @param {String} options.type
 *   select how to instantiate primitive
 *   ie fromRaw, fromJSON etc
 * @param {String} options.chain
 *   blockchain name
 * @param {String} options.network
 *   blockchain network
 *   ie main, testnet, regtest
 */
export function toKeyRing(key, options) {
  const { type, chain, network, compress } = options;

  switch (type) {
    case 'public':
      return KeyRing[chain].fromPublic(key, network);

    case 'private':
      return KeyRing[chain].fromPrivate(key, compress);

    case 'options':
      return KeyRing[chain].fromOptions(options);

    default:
      return null;
  }
}

/*
 * create HDPublicKey object
 * @param {Object} options
 * @param {String} options.type
 *   select how to instantiate primitive
 *   ie fromRaw, fromJSON etc
 * @param {String} options.chain
 *   blockchain name
 * @param {String} options.network
 *   blockchain network
 *   ie main, testnet, regtest
 */
export function toHDPublicKey(options) {
  const { type, chain, xpubkey, network } = options;

  switch (type) {
    case 'base58':
      return HDPublicKey[chain].fromBase58(xpubkey, network);

    default:
      return null;
  }
}
