// @flow

/* eslint-env jest */

import { encode, decode } from './index';

describe('packets', () => {
  describe('pingres', () => {
    describe('encode', () => {
      test('normal', () => {
        expect(
          encode({
            type: 'pingres',
          })
        ).toEqual([
          // fixedHeader
          0xd0, // packetType + flags
          0, // remainingLength
        ]);
      });
    });

    describe('decode', () => {
      test('too short', () => {
        expect(decode(Uint8Array.from([0xd0]))).toBe(null);
      });

      test('normal', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              0xd0, // packetType + flags
              0, // remainingLength
            ])
          )
        ).toEqual({
          type: 'pingres',
        });
      });
    });
  });
});
