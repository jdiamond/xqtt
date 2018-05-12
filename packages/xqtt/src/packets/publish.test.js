// @flow

/* eslint-env jest */

import { encode } from './index';

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
  });
});
