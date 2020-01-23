/*!
 * chain.js - basic utilities for bpanel chain operations
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import assert from 'bsert';
import { getClient } from './clients';
import helpers from './helpers';

// Simple API call to retrieve a block at specified height or hash
// returns a promise
export const getBlock = hashOrHeight => {
  try {
    const client = getClient();
    return client.node.getBlock(hashOrHeight);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('There was a problem retrieving block: ', e);
  }
};

/*
 * Returns a promise to make an api call for block info
 * @param {number|string} hashOrHeight - if number getblockbyheight
 * else getblock (by hash)
 * @param {boolean=true} [verbose] - true to get block details,
 * false for just hex
 * @param {boolean=false} [details] - true for tx details
 * @returns {Promise}
 */
export const getBlockInfo = (hashOrHeight, verbose=true, details=false) => {
  const client = getClient();
  try {
    if (typeof hashOrHeight === 'number')
      return client.node.execute('getblockbyheight', [hashOrHeight, verbose, details]);
    if (typeof hashOrHeight === 'string')
      return client.node.execute('getblock', [hashOrHeight, verbose, details]);
    throw new Error('Must pass either string for block hash or number for block height');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('There was a problem retrieving block: ', e);
  }
}

/*
 * SPV equivalent to getBlockInfo above
 */
export const getBlockHeaderInfo = async (hashOrHeight, verbose=true, details=false) => {
  const client = getClient();
  try {
    // If we're in SPV mode, try and get the block header
    let hash = hashOrHeight;
    if (typeof hashOrHeight === 'number') {
      hash = await client.node.execute('getblockhash', [hashOrHeight]);
    }
    const blockHeader = await client.node.execute('getblockheader', [hash, true]);
    return blockHeader;
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error('There was a problem retrieving block header: ', e);
  }
}

export function calcProgress(start, tip) {
  const current = tip - start;
  const end = helpers.now() - start - 40 * 60;
  return Math.min(1, current / end);
}

// utility to get a range of blocks (or just headers, in SPV mode)
export async function getBlocksInRange(start, end, step = 1, SPV = false) {
  // get all blocks from blockHeight `start` up to `start`+ n
  // create an array of the blocks
  const blocks = [];

  let height = start;
  if (start < end) {
    // counting up
    assert(step > 0, 'Step needs to be greater than zero to count up');
    while (height < end) {
      try {
        const block =
          SPV ?
            await getBlockHeaderInfo(height) :
            await getBlockInfo(height);
        blocks.push(block);
        height += step;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error retrieving block: ', e);
        return blocks;
      }
    }
  } else if (start > end) {
    // counting down
    let _step = step;
    if (step >= 1) {
      _step = -1;
    } else {
      assert(step < 1, 'Step must be negative to countdown');
    }
    while (height > end) {
      try {
        const block =
          SPV ?
            await getBlockHeaderInfo(height) :
            await getBlockInfo(height);;
        blocks.push(block);
        height += _step;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error retrieving block: ', e);
        height += _step;
        // return blocks;
      }
    }
  }

  return blocks;
}

/*
 * @const
 * supported chains
 */
const CHAINS = ['bitcoin', 'bitcoincash', 'handshake', 'flo'];

/*
 * Whether or not the chain is supported
 * @param {String} - chain
 * @returns bool
 */
export function isChainSupported(chain) {
  return CHAINS.includes(chain);
}

export default {
  calcProgress,
  getBlockInfo,
  getBlock,
  getBlocksInRange,
  isChainSupported,
  CHAINS,
};
