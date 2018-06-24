// @flow

/* eslint-env jest */

import { WebSocket, Server } from 'mock-socket';
import { encode, decode } from 'xqtt';

import Client from './client';

describe('Client', () => {
  test('can be constructed', () => {
    expect(new Client()).toBeDefined();
  });

  test('generates valid ws and wss URLs', () => {
    expect(new Client().getWebSocketURL()).toBe('ws://localhost');
    expect(new Client({ host: 'example.com' }).getWebSocketURL()).toBe('ws://example.com');
    expect(new Client({ host: 'example.com', port: 80 }).getWebSocketURL()).toBe(
      'ws://example.com'
    );
    expect(new Client({ host: 'example.com', port: 8080 }).getWebSocketURL()).toBe(
      'ws://example.com:8080'
    );
    expect(new Client({ protocol: 'wss', host: 'example.com' }).getWebSocketURL()).toBe(
      'wss://example.com'
    );
    expect(new Client({ protocol: 'wss', host: 'example.com', port: 443 }).getWebSocketURL()).toBe(
      'wss://example.com'
    );
    expect(new Client({ protocol: 'wss', host: 'example.com', port: 8080 }).getWebSocketURL()).toBe(
      'wss://example.com:8080'
    );
  });

  describe('WebSocket usage', () => {
    let mockServer;

    beforeEach(() => {
      mockServer = new Server('ws://localhost');

      mockServer.on('connection', (_server, _client) => {});

      mockServer.on('message', msg => {
        const packet = decode(msg);

        switch (packet.type) {
          case 'connect':
            mockServer.send(
              Uint8Array.from(
                encode({
                  type: 'connack',
                })
              ).buffer
            );
            break;
        }
      });
    });

    afterEach(() => {
      return mockServer.stop();
    });

    test('connects', async () => {
      const client = new Client({ WebSocket });
      await client.connect();
      // client.publish('topic', 'payload');
      // client.disconnect();
    });
  });
});
