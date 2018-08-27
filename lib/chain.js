/*!
 * chain.js - basic utilities for bpanel chain operations
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

import assert from 'bsert';
import { bpanelClient } from './clients';
import helpers from './helpers';

const client = bpanelClient();
// Simple API call to retrieve a block at specified height or hash
// returns a promise
export const getBlock = hashOrHeight => {
  try {
    return client.getBlock(hashOrHeight);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('There was a problem retrieving block: ', e);
  }
};

export function calcProgress(start, tip) {
  const current = tip - start;
  const end = helpers.now() - start - 40 * 60;
  return Math.min(1, current / end);
}

// utility to get a range of blocks
export async function getBlocksInRange(start, end, step = 1) {
  // get all blocks from blockHeight `start` up to `start`+ n
  // create an array of the blocks
  const blocks = [];

  let height = start;
  if (start < end) {
    // counting up
    assert(step > 0, 'Step needs to be greater than zero to count up');
    while (height < end) {
      try {
        const block = await getBlock(height);
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
        const block = await getBlock(height);
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
const CHAINS = ['bitcoin', 'bitcoincash', 'handshake'];

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
  getBlock,
  getBlocksInRange,
  isChainSupported,
  CHAINS,
};
