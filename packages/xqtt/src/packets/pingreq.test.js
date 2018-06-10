// @flow

/* eslint-env jest */

import { encode, decode } from './index';

describe('packets', () => {
  describe('pingreq', () => {
    describe('encode', () => {
      test('normal', () => {
        expect(
          encode({
            type: 'pingreq',
          })
        ).toEqual([
          // fixedHeader
          0xc0, // packetType + flags
          0, // remainingLength
        ]);
      });
    });

    describe('decode', () => {
      test('too short', () => {
        expect(decode(Uint8Array.from([0xc0]))).toBe(null);
      });

      test('normal', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              0xc0, // packetType + flags
              0, // remainingLength
            ])
          )
        ).toEqual({
          type: 'pingreq',
        });
      });
    });
  });
});
