// @flow

import net from 'net';
import tls from 'tls';
import { Client as BaseClient } from 'xqtt';
import type { ClientOptions as BaseClientOptions } from 'xqtt';

type ClientOptions = BaseClientOptions & {
  tls?: boolean | Object,
};

export default class Client extends BaseClient {
  socket: net.Socket;

  constructor(options: ?ClientOptions) {
    super(options);
  }

  open() {
    const tlsOptions = this.options.tls;

    if (tlsOptions) {
      this.socket = tls.connect(
        Object.assign({}, this.options, typeof tlsOptions === 'object' ? tlsOptions : {})
      );
    } else {
      const { host, port } = this.options;

      this.socket = net.connect(
        port,
        host
      );
    }

    this.socket.on('connect', this.handleConnectEvent);
    this.socket.on('close', this.handleCloseEvent);
    this.socket.on('error', this.handleErrorEvent);
    this.socket.on('data', this.handleDataEvent);
  }

  write(bytes: any) {
    const buffer = Buffer.from(bytes);

    this.socket.write(buffer);
  }

  close() {
    this.socket.end();
  }

  handleConnectEvent = () => {
    this.connectionOpened();
  };

  handleCloseEvent = () => {
    this.connectionClosed();
  };

  handleErrorEvent = (e: Error) => {
    this.connectionError(e);
  };

  handleDataEvent = (data: Buffer) => {
    const buffer = new Uint8Array(data);

    this.bytesReceived(buffer);
  };
}

Client.prototype.defaultClientIdPrefix = 'nqtt';
