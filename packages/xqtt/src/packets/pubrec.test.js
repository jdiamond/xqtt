// @flow

/* eslint-env jest */

import { encode, decode } from './index';

describe('packets', () => {
  describe('pubrec', () => {
    describe('encode', () => {
      test('normal', () => {
        expect(
          encode({
            type: 'pubrec',
            id: 1337,
          })
        ).toEqual([
          // fixedHeader
          0x50, // packetType + flags
          2, // remainingLength
          // variableHeader
          5, // id MSB
          57, // id LSB
        ]);
      });
    });

    describe('decode', () => {
      test('too short', () => {
        expect(decode(Uint8Array.from([0x50]))).toBe(null);
        expect(decode(Uint8Array.from([0x50, 2]))).toBe(null);
        expect(decode(Uint8Array.from([0x50, 2, 5]))).toBe(null);
      });

      test('normal', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              0x50, // packetType + flags
              2, // remainingLength
              // variableHeader
              5, // id MSB
              57, // id LSB
            ])
          )
        ).toEqual({
          type: 'pubrec',
          id: 1337,
        });
      });
    });
  });
});
