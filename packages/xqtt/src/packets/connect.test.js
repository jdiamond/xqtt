// @flow

/* eslint-env jest */

import { encode } from './index';

describe('packet', () => {
  describe('connect', () => {
    describe('encode', () => {
      test('only clientId', () => {
        expect(
          encode({
            type: 'connect',
            clientId: 'id',
          })
        ).toEqual([
          // fixedHeader
          16, // packetType + flags
          14, // remainingLength
          // variableHeader
          0, // protocolNameLength MSB
          4, // protocolNameLength LSB
          77, // 'M'
          81, // 'Q'
          84, // 'T'
          84, // 'T'
          4, // protocolLevel
          2, // connectFlags (cleanSession)
          0, // keepAlive MSB
          0, // keepAlive LSB
          // payload
          // clientId
          0, // length MSB
          2, // length LSB
          105, // 'i'
          100, // 'd'
        ]);
      });

      test('clean: false', () => {
        expect(
          encode({
            type: 'connect',
            clientId: 'id',
            clean: false,
          })
        ).toEqual([
          // fixedHeader
          16, // packetType + flags
          14, // remainingLength
          // variableHeader
          0, // protocolNameLength MSB
          4, // protocolNameLength LSB
          77, // 'M'
          81, // 'Q'
          84, // 'T'
          84, // 'T'
          4, // protocolLevel
          0, // connectFlags
          0, // keepAlive MSB
          0, // keepAlive LSB
          // payload
          // clientId
          0, // length MSB
          2, // length LSB
          105, // 'i'
          100, // 'd'
        ]);
      });

      test('keepAlive', () => {
        expect(
          encode({
            type: 'connect',
            clientId: 'id',
            keepAlive: 300,
          })
        ).toEqual([
          // fixedHeader
          16, // packetType + flags
          14, // remainingLength
          // variableHeader
          0, // protocolNameLength MSB
          4, // protocolNameLength LSB
          77, // 'M'
          81, // 'Q'
          84, // 'T'
          84, // 'T'
          4, // protocolLevel
          2, // connectFlags (cleanSession)
          1, // keepAlive MSB
          44, // keepAlive LSB
          // payload
          // clientId
          0, // length MSB
          2, // length LSB
          105, // 'i'
          100, // 'd'
        ]);
      });

      test('username and password', () => {
        expect(
          encode({
            type: 'connect',
            clientId: 'id',
            username: 'user',
            password: 'pass',
          })
        ).toEqual([
          // fixedHeader
          16, // packetType + flags
          26, // remainingLength
          // variableHeader
          0, // protocolNameLength MSB
          4, // protocolNameLength LSB
          77, // 'M'
          81, // 'Q'
          84, // 'T'
          84, // 'T'
          4, // protocolLevel
          194, // connectFlags (usernameFlag, passwordFlag, cleanSession)
          0, // keepAlive MSB
          0, // keepAlive LSB
          // payload
          // clientId
          0, // length MSB
          2, // length LSB
          105, // i
          100, // d
          // username
          0, // length MSB
          4, // length LSB
          117, // u
          115, // s
          101, // e
          114, // r
          // password
          0, // length MSB
          4, // length LSB
          112, // p
          97, // a
          115, // s
          115, // s
        ]);
      });
    });
  });
});
