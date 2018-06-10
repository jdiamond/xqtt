// @flow

/* eslint-env jest */

import { decode } from './index';

describe('packets', () => {
  describe('connack', () => {
    describe('decode', () => {
      test('too short', () => {
        expect(decode(Uint8Array.from([32]))).toBe(null);
        expect(decode(Uint8Array.from([32, 2]))).toBe(null);
        expect(decode(Uint8Array.from([32, 2, 0]))).toBe(null);
      });

      test('normal', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              32, // packetType + flags
              2, // remainingLength
              // variableHeader
              0, // connack flags
              0, // return code
            ])
          )
        ).toEqual({
          type: 'connack',
          sessionPresent: false,
          returnCode: 0,
        });
      });

      test('sessionPresent', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              32, // packetType + flags
              2, // remainingLength
              // variableHeader
              1, // connack flags (sessionPresent)
              0, // return code
            ])
          )
        ).toEqual({
          type: 'connack',
          sessionPresent: true,
          returnCode: 0,
        });
      });

      test('returnCode', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              32, // packetType + flags
              2, // remainingLength
              // variableHeader
              0, // connack flags
              4, // return code (bad username or password)
            ])
          )
        ).toEqual({
          type: 'connack',
          sessionPresent: false,
          returnCode: 4,
        });
      });
    });
  });
});
