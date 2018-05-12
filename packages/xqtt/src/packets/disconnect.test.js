// @flow

/* eslint-env jest */

import { encode } from './index';

describe('packets', () => {
  describe('disconnect', () => {
    describe('encode', () => {
      test('it works', () => {
        expect(
          encode({
            type: 'disconnect',
            clientId: 'id',
          })
        ).toEqual([
          // fixedHeader
          224, // packetType + flags
          0, // remainingLength
        ]);
      });
    });
  });
});
