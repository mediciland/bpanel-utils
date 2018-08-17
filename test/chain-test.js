import { expect } from 'chai';

import { getBlock, getBlocksInRange } from '../lib/chain';
import fetchMock from 'fetch-mock';

describe('chainUtils', () => {
  xdescribe('getBlock', () => {
    let blockHeight;
    let responseJson;

    beforeEach(() => {
      blockHeight = 123;
      responseJson = { foo: 'bar' };
      fetchMock.config.overwriteRoutes = true;
      const blockEndpoint = getBlock(blockHeight);
      fetchMock.get(blockEndpoint, responseJson);
    });

    afterEach(() => {
      fetchMock.restore();
    });

    it('should return response json', async () => {
      const block = await getBlock(blockHeight);
      expect(block).to.deep.equal(responseJson);
    });

    it('should call the get block endpoint', async () => {
      await getBlock(blockHeight);
      const call = fetchMock.called(get.block(blockHeight));
      expect(call).to.be.true;
    });
  });

  xdescribe('getBlocksInRange', () => {
    let blockHeights;
    let chainHeight;
    beforeEach(() => {
      chainHeight = 10;
      blockHeights = Array(chainHeight)
        .fill(chainHeight)
        .map((num, index) => num - index);
      blockHeights.forEach(height => {
        const endpoint = getBlock(height);
        fetchMock.get(endpoint, { height });
      });
    });
    it('should throw if step is negative when counting up', async () => {
      try {
        await chainUtils.getBlocksInRange(0, chainHeight, -1);
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('should throw if step is positive when counting down', async () => {
      try {
        await chainUtils.getBlocksInRange(chainHeight, 0, 1);
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('should call the block endpoint for each block in range', async () => {
      await chainUtils.getBlocksInRange(1, chainHeight);
      blockHeights.forEach(height => {
        const endpoint = get.block(height);
        const called = fetchMock.called(endpoint);
        expect(called).to.be.true;
      });
    });

    it('should return an array of blocks from the server', async () => {
      const blocks = await chainUtils.getBlocksInRange(chainHeight, 0, -1);
      blockHeights.forEach((height, index) => {
        // this is what we mocked the blk response to be
        expect(blocks[index]).to.deep.equal({ height });
      });
    });
  });
});
