const { networks } = require('bcoin');
const assert = require('bsert');
const url = require('url');

// supported chains
const CHAINS = ['bitcoin', 'bitcoincash'];

// supported block explorers
// can add more here
const BLOCK_EXPLORERS = {
  bitcoin: {
    main: {
      'btc.com': 'https://btc.com', // /{txhash}
      blocktrail: 'https://www.blocktrail.com/BTC',
    },
    testnet: {
      blocktrail: 'https://www.blocktrail.com/tBTC', // /tx/{txhash}
    }
  },
  bitcoincash: {
    main: {
      'btc.com': 'https://bch.btc.com',
      blocktrail: 'https://www.blocktrail.com/BCC',
    },
    testnet: {
      blocktrail: 'https://www.blocktrail.com/tBCC',
    },
  },
};

// the hyperlink suffixes for
// different types of queries
const EXPLORER_SUFFIXES = {
  blocktrail: {
    transaction: '/tx/',
  },
  'btc.com': {
    transaction: '/',
  },
};

/**
 * block explorer client
 *
 * currently supports:
 * networks: main,testnet
 * network: bitcoin,bitcoincash
 *
 * rendering of tx hyperlinks
 *
 */
class BlockExplorerClient {
  /**
   * Create a block explorer client
   * @constructor
   * @param options
   *
   */
  constructor(options) {
    this._explorers = BLOCK_EXPLORERS;
    this._chains = CHAINS;
    this._suffixes = EXPLORER_SUFFIXES;
    this._networks = networks.types;
    this._chain = null;
    this._network = null;

    if (options)
      this.fromOptions(options);
  }

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  fromOptions(options) {
    assert(typeof options === 'object', 'options must be an object');
    assert(options.chain, 'must pass options.chain');
    assert(options.network, 'must past options.network');

    assert(this._chains.includes(options.chain), `${options.chain} must be a valid chain: ${this._chains}`)
    this._chain = options.chain;

    assert(this._networks.includes(options.network), `${options.network} must be a valid network: ${this._networks}`);
    this._network = options.network;

    return this;
  }

  /**
   * get compatible explorers
   */
  getExplorers() {
    return this._explorers[this._chain][this._network];
  }

  /**
   * get suffixes for explorer hyperlinks
   */
  getSuffixes() {
    return this._suffixes;
  }

  /**
   * string interpolate the hyperlink
   * @param name
   * @param url
   * @param type
   * @returns {String}
   */
  toLink(name, url, type) {
    const suffixes = this.getSuffixes();
    return `${url}${suffixes[name][type]}`;
  }

  /**
   * render transaction specific
   * hyperlinks for each supported
   * block explorer
   * @param txhash
   * @returns {[]url.URL}
   */
  getTransactionLinks(txhash) {
    const explorers = this.getExplorers();
    const links = [];
    for (let [key, val] of Object.entries(explorers)) {
      const link = this.toLink(key, val, 'transaction');
      const u = url.parse(`${link}${txhash}`);
      links.push(u);
    }
    return links;
  }
}

module.exports = {
  BlockExplorerClient,
}
