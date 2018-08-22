import { assert } from 'chai';
const url = require('url');
const fetch = require('node-fetch');

import {
  BlockExplorerClient,
} from '../lib/blockExplorerClient.js';

describe('Block Explorer Client', () => {
  it('Should instantiate from options', () => {

    const client = BlockExplorerClient.fromOptions({
      chain: 'bitcoin',
      network: 'main',
    });

    assert.ok(client);
  });

  it('Should return transaction urls', () => {

    const network = 'main';
    const chain = 'bitcoin';
    const txhash = 'foobar';

    const client = BlockExplorerClient.fromOptions({
      network,
      chain,
    });

    const links = client.getTransactionLinks(txhash);

    for (let link of links)
      assert.equal(link.href.includes(txhash), true, 'it should render with the tx hash');
  });
});

