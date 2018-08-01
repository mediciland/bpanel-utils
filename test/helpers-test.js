import { expect } from 'chai';

import { getHash } from '../lib/helpers';

describe.only('helpers', () => {
  describe('getHash', () => {
    it('should hash stringified versions of non-string inputs', () => {
      const obj = { test: 'test' };
      const stringified = JSON.stringify(obj);
      const objHash = getHash(obj);
      const stringHash = getHash(stringified);
      expect(objHash).to.equal(stringHash);
    });

    it('should return a unique 32-byte hex string given some input', () => {
      let test = 'test';
      const testHash = getHash(test);
      expect(testHash).to.have.length(64);
      test = `${test} `;
      const newHash = getHash(test);
      expect(newHash).to.not.equal(testHash);
    });
  });
});
