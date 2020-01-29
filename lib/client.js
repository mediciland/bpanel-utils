/*!
 * clients.js - client extensions of bclient to connect to bpanel app server
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import bclient from 'bclient';
import hsclient from 'hs-client';
import fclient from '@oipwg/fclient';
import { Client } from 'bcurl';
import assert from 'bsert';
import { MultisigClient } from 'bmultisig';

import { isChainSupported } from './chain';

const { NodeClient: BNodeClient, WalletClient: BWalletClient } = bclient;
const { NodeClient: HNodeClient, WalletClient: HWalletClient } = hsclient;
const { NodeClient: FNodeClient, WalletClient: FWalletClient } = fclient;

class BPClient extends Client {
  /**
   * Create a client for use in bPanel.
   * @constructor
   * @param {Object} options
   * @param {string} [options.path] - base path
   * @param {string} options.id - id of node client will be querying
   * @param {chain} options.chain - one of 'bitcoin', 'bitcoincash',
   * or 'handshake'. Will assume 'bitcoin' if not set
   * @param {NodeClient} [node] - can optionally pass a node client
   * @param {WalletClient} [wallet] - can optionally pass a wallet client
   * @param {MultisigClient} [multisig] - can optionally pass a multisig client
   * @returns {BPClient}
   */
  constructor(options) {
    super(options);

    const opts = new ClientOptions(options);

    // keep ref to pass to generated clients
    this.options = { ...options, ...opts };
    this.path = opts.path;
    this.id = opts.id;
    this.chain = opts.chain;
    this.node = opts.node;
    this.wallet = opts.wallet;
    this.multisig = opts.multisig;

    // supported client types
    this.types = ['node', 'wallet', 'multisig'];

    this.init();
  }

  async init() {
    if (this.id) {
      this.setNodeClient();
      this.setWalletClient();
      this.setMultisigClient();
      await this.setSPV();
    }
    return this;
  }

  /*
   * Reset the class with new options
   * since the base options start as null
   * any options that are not explicitly reset
   * will be gone.
   * @returns {BpanelClient}
   */
  reset(options) {
    return new this.constructor(options);
  }

  /*
   * Set a new id and chain if necessary
   * will update all clients as well
   * @param {string} id - id for client
   * @param {string} chain - One of 'bitcoin',
   * 'bitcoincash', or 'handshake'
   * @returns {BPClient}
   */
  async setClientInfo(id, chain) {
    assert(id && typeof id === 'string');
    this.id = id;
    if (chain) {
      assert(typeof chain === 'string');
      assert(isChainSupported(chain), `${chain} is not a supported chain`);
      this.chain = chain;
    }

    this.options.id = this.id;
    this.options.chain = this.chain;

    this.setNodeClient();
    this.setWalletClient();
    this.setMultisigClient();
    await this.setSPV();

    this.emit('set clients', { id: this.id, chain: this.chain });
    return this;
  }

  /**
   * Get an object of all clients available on server
   * @returns {Promise}
   */
  getClients() {
    return this.get('/clients');
  }

  /**
   * Get info for default client on the server
   * @returns {Promise}
   */
  getDefault() {
    return this.get('/clients/default');
  }

  /**
   * Get info from bPanel server about client of this.id
   * @param {string} [_id] - id of client you'd like to get
   * info for
   * @returns {Promise}
   */
  getClientInfo(_id, health=false) {
    const id = _id ? _id : this.id;
    return this.get(`/clients/${id}`, { health });
  }

  /*
   * Get a client for sending requests to a node
   * Returns this.node and sets it if none is set
   * @returns {Client}
   */
  getNodeClient() {
    if (!this.node) this.setNodeClient();
    return this.node;
  }

  /*
   * Get a client for sending requests to a wallet node
   * Returns this.wallet and sets it if none is set
   * @returns {Client}
   */
  getWalletClient() {
    if (!this.wallet) this.setWalletClient();
    return this.wallet;
  }

  /*
   * Get a client for sending requests to a multisig node
   * Returns this.multisig and sets it if none is set
   * @returns {Client}
   */
  getMultisigClient() {
    if (!this.multisig) this.setMultisigClient();
    return this.multisig;
  }

  /*
   * Set the node client for the class
   * @param {string} _path - Can set a custom path
   * @returns {void}
   */
  setNodeClient(_path = null) {
    let path = _path;
    if (!path) {
      assert(this.id, 'Must have an id before setting node');
      path = this.getClientPaths(this.id).node;
    }

    const options = { ...this.options, path };
    if (this.chain === 'handshake') this.node = new HNodeClient(options);
    if (this.chain === 'flo') this.node = new FNodeClient(options);
    // defaults to returning bcoin client
    else this.node = new BNodeClient(options);
    this.emit('set node', { id: this.id, chain: this.chain });
  }

  /*
   * Set the wallet client for the class
   * @param {string} _path - Can set a custom path
   * @returns {void}
   */
  setWalletClient(_path = null) {
    let path = _path;
    if (!path) {
      assert(this.id, 'Must have an id before setting node');
      path = this.getClientPaths(this.id).wallet;
    }

    const options = { ...this.options, path };
    if (this.chain === 'handshake') this.wallet = new HWalletClient(options);
    if (this.chain === 'flo') this.wallet = new FWalletClient(options);
    // defaults to returning bcoin client
    else this.wallet = new BWalletClient(options);
    this.emit('set wallet', { id: this.id, chain: this.chain });
  }

  /*
   * Set the wallet client for the class
   * @param {string} _path - Can set a custom path
   * @returns {void}
   */
  setMultisigClient(_path = null) {
    let path = _path;
    if (!path) {
      assert(this.id, 'Must have an id before setting node');
      path = this.getClientPaths(this.id).multisig;
    }

    const options = { ...this.options, path };
    this.multisig = new MultisigClient(options);
    this.emit('set multisig', { id: this.id, chain: this.chain });
  }

  /*
   * Get path for the client of a given id. Defaults to this.id
   * @param {string} [_id] - pass an id to get paths for another client
   * @returns {object} paths - object with client types mapped to endpoint
   * in format: `/clients/:id/:type` where type can be 'node',
   * 'wallet', or 'multisig'
   */
  getClientPaths(_id) {
    const id = _id ? _id : this.id;
    return this.types.reduce((paths, type) => {
      paths[type] = `/clients/${id}/${type}`;
      return paths;
    }, {});
  }

  /*
   * Until bcoin, bcash and hsd return SPV flags in `info` we need to test
   */
  async setSPV() {
    try {
      await this.node.getBlock(0);
      this.isSPV = false;
    } catch (e) {
      this.isSPV = true;
    }
  }
}

/**
 * Client Options
 */

class ClientOptions {
  constructor(options) {
    this.id = '';
    this.path = '';
    this.chain = null;
    this.node = null;
    this.wallet = null;
    this.multisig = null;

    if (options) this.fromOptions(options);
  }

  fromOptions(options) {
    const { id, chain, path, node, wallet, multisig } = options;

    if (id) {
      assert(typeof id === 'string');
      this.id = id;
    }

    if (chain) {
      assert(typeof chain === 'string');
      assert(isChainSupported(chain), `${chain} is not a supported chain`);
      this.chain = chain;
    }

    if (node) {
      assert(node instanceof Client);
      // want to make sure that the client matches with the chain
      if (this.chain === 'bitcoin' || this.chain === 'bitcoincash')
        assert(node instanceof BNodeClient);
      if (this.chain === 'handshake') assert(node instanceof HNodeClient);
      if (this.chain === 'flo') assert(node instanceof FNodeClient);
      this.node = node;
    }

    if (wallet) {
      assert(wallet instanceof Client);
      // want to make sure that the client matches with the chain
      if (this.chain === 'bitcoin' || this.chain === 'bitcoincash')
        assert(wallet instanceof BWalletClient);
      if (this.chain === 'handshake') assert(wallet instanceof HWalletClient);
      if (this.chain === 'flo') assert(wallet instanceof FWalletClient);
      this.wallet = wallet;
    }

    if (multisig) {
      assert(multisig instanceof MultisigClient);
      this.multisig = multisig;
    }

    if (path) {
      // TODO: add more robust path handling similar to bmultisig client
      assert(typeof path === 'string');
      this.path = path;
    }

    return this;
  }
}

export default BPClient;
