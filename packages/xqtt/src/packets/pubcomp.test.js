// @flow

/* eslint-env jest */

import { encode, decode } from './index';

describe('packets', () => {
  describe('pubcomp', () => {
    describe('encode', () => {
      test('normal', () => {
        expect(
          encode({
            type: 'pubcomp',
            id: 1337,
          })
        ).toEqual([
          // fixedHeader
          0x70, // packetType + flags
          2, // remainingLength
          // variableHeader
          5, // id MSB
          57, // id LSB
        ]);
      });
    });

    describe('decode', () => {
      test('too short', () => {
        expect(decode(Uint8Array.from([0x70]))).toBe(null);
        expect(decode(Uint8Array.from([0x70, 2]))).toBe(null);
        expect(decode(Uint8Array.from([0x70, 2, 5]))).toBe(null);
      });

      test('normal', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              0x70, // packetType + flags
              2, // remainingLength
              // variableHeader
              5, // id MSB
              57, // id LSB
            ])
          )
        ).toEqual({
          type: 'pubcomp',
          id: 1337,
        });
      });
    });
  });
});
