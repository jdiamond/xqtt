// @flow

/* eslint-env jest */

import { encode, decode } from './index';

describe('packets', () => {
  describe('pubrel', () => {
    describe('encode', () => {
      test('normal', () => {
        expect(
          encode({
            type: 'pubrel',
            id: 1337,
          })
        ).toEqual([
          // fixedHeader
          0x62, // packetType + flags
          2, // remainingLength
          // variableHeader
          5, // id MSB
          57, // id LSB
        ]);
      });
    });

    describe('decode', () => {
      test('too short', () => {
        expect(decode(Uint8Array.from([0x62]))).toBe(null);
        expect(decode(Uint8Array.from([0x62, 2]))).toBe(null);
        expect(decode(Uint8Array.from([0x62, 2, 5]))).toBe(null);
      });

      test('normal', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              0x62, // packetType + flags
              2, // remainingLength
              // variableHeader
              5, // id MSB
              57, // id LSB
            ])
          )
        ).toEqual({
          type: 'pubrel',
          id: 1337,
        });
      });
    });
  });
});
