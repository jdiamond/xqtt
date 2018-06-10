// @flow

/* eslint-env jest */

import { decode } from './index';

describe('packets', () => {
  describe('suback', () => {
    describe('decode', () => {
      test('it works', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              0xb0, // packetType + flags
              2, // remainingLength
              // variableHeader
              0, // id MSB
              1, // id LSB
            ])
          )
        ).toEqual({
          type: 'unsuback',
          id: 1,
        });
      });
    });
  });
});
