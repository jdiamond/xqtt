// @flow

import { Client as BaseClient } from 'xqtt';
import type { ClientOptions as BaseClientOptions } from 'xqtt';

type ClientOptions = BaseClientOptions & {
  WebSocket?: (string, string) => WebSocket,
  subprotocol?: string,
};

// ms to wait before checking if data is still being written
const closeTimeout = 500;

export default class Client extends BaseClient {
  socket: WebSocket;

  defaultSubprotocol: string;

  constructor(options: ?ClientOptions) {
    super(options);
  }

  open() {
    const url = this.getWebSocketURL();

    const { subprotocol } = this.options;

    this.socket = new (this.options.WebSocket || WebSocket)(
      url,
      subprotocol || this.defaultSubprotocol
    );

    this.socket.binaryType = 'arraybuffer';

    this.socket.addEventListener('open', this.handleOpenEvent);
    this.socket.addEventListener('close', this.handleCloseEvent);
    this.socket.addEventListener('error', this.handleErrorEvent);
    this.socket.addEventListener('message', this.handleMessageEvent);
  }

  write(bytes: any) {
    const buffer = Uint8Array.from(bytes);

    this.socket.send(buffer);
  }

  close() {
    if (this.socket.bufferedAmount > 0) {
      this.log(`waiting for ${this.socket.bufferedAmount} bytes to finish sending`);

      setTimeout(() => this.close(), closeTimeout);
    } else {
      this.socket.close();
    }
  }

  getWebSocketURL() {
    const { protocol, host, port } = this.options;

    function formatPort() {
      // The default protocol is `ws` which uses port 80.
      if ((!protocol || protocol === 'ws') && (!port || port === 80)) {
        return '';
      }

      // If the protocol is `wss`, the default port is 443.
      if (protocol === 'wss' && (!port || port === 443)) {
        return '';
      }

      return port ? `:${port}` : '';
    }

    return `${protocol || 'ws'}://${host || 'localhost'}${formatPort()}`;
  }

  handleOpenEvent = () => {
    this.connectionOpened();
  };

  handleCloseEvent = () => {
    this.connectionClosed();
  };

  handleErrorEvent = (e: Event) => {
    this.connectionError(e);
  };

  handleMessageEvent = (e: Event) => {
    const msg = ((e: any): MessageEvent);

    if (msg.data instanceof ArrayBuffer) {
      const buffer = new Uint8Array(msg.data);

      this.bytesReceived(buffer);
    }
  };
}

Client.prototype.defaultSubprotocol = 'mqtt';
Client.prototype.defaultClientIdPrefix = 'wqtt';
