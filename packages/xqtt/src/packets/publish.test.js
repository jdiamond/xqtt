// @flow

/* eslint-env jest */

import { encode, decode } from './index';

describe('packets', () => {
  describe('publish', () => {
    describe('encode', () => {
      test('it works', () => {
        expect(
          encode({
            type: 'publish',
            topic: 'a/b',
            payload: 'payload',
          })
        ).toEqual([
          // fixedHeader
          48, // packetType + flags
          12, // remainingLength
          // variableHeader
          0, // topicLength MSB
          3, // topicLength LSB
          97, // 'a'
          47, // '/'
          98, // 'b'
          // payload
          112, // 'p'
          97, // 'a'
          121, // 'y'
          108, // 'l'
          111, // 'o'
          97, // 'a'
          100, // 'd'
        ]);
      });
    });

    describe('decode', () => {
      test('it works', () => {
        expect(
          decode(
            Uint8Array.from([
              // fixedHeader
              48, // packetType + flags
              12, // remainingLength
              // variableHeader
              0, // topicLength MSB
              3, // topicLength LSB
              97, // 'a'
              47, // '/'
              98, // 'b'
              // payload
              112, // 'p'
              97, // 'a'
              121, // 'y'
              108, // 'l'
              111, // 'o'
              97, // 'a'
              100, // 'd'
            ])
          )
        ).toEqual({
          type: 'publish',
          dup: false,
          qos: 0,
          retain: false,
          id: null,
          topic: 'a/b',
          payload: Uint8Array.from([
            112, // 'p'
            97, // 'a'
            121, // 'y'
            108, // 'l'
            111, // 'o'
            97, // 'a'
            100, // 'd'
          ]),
        });
      });
    });
  });
});
