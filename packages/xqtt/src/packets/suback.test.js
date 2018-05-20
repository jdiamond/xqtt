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
              0x90, // packetType + flags
              3, // remainingLength
              // variableHeader
              0, // id MSB
              1, // id LSB
              // payload
              0,
            ])
          )
        ).toEqual({
          type: 'suback',
          id: 1,
          returnCodes: [0],
        });
      });
    });
  });
});
