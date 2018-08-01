import { expect } from 'chai';
import bcrypto from 'bcrypto';

import { getHash } from '../lib/helpers';

describe('helpers', () => {
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

    it('should hash a buffer', () => {
      const test = Buffer.from('test', 'ascii');
      const hash = getHash(test, 'sha256');
      const expected = bcrypto.sha256.digest(test);
      expect(hash).to.equal(expected.toString('hex'));
    });

    it('should be able to use other hashing algos', () => {
      const hashFunc = 'md5';
      const preimage = Buffer.from('test', 'ascii');
      const actual = getHash(preimage, hashFunc);
      const expected = bcrypto[hashFunc].digest(preimage);
      expect(actual).to.equal(expected.toString('hex'));

      // throw on unknown algos
      const badAlgo = () => getHash(preimage, 'fake algo');
      expect(badAlgo).to.throw();
    });

    it('should support offest and len for return string', () => {
      const preimage = 'test';
      const offset = 2;
      const len = 8;
      const actual = getHash(preimage, 'sha256', offset, len);
      const full = getHash(preimage, 'sha256');
      expect(actual).to.have.length(len);
      expect(actual).to.equal(full.slice(offset, offset + len));
      const noLen = getHash(preimage, 'sha256', 2);
      expect(noLen).to.equal(full.slice(offset));
    });
  });
});
