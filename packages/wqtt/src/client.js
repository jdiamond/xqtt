// @flow

import { Client as BaseClient } from 'xqtt';
import type { ClientOptions as BaseClientOptions } from 'xqtt';

type ClientOptions = BaseClientOptions & {
  subprotocol?: string,
};

export default class Client extends BaseClient {
  socket: WebSocket;

  defaultSubprotocol: string;
  defaultClientIdPrefix: string;

  constructor(options: ClientOptions) {
    super(options);
  }

  open() {
    return new Promise((resolve, reject) => {
      const url = this.getWebSocketURL();

      const { subprotocol } = this.options;

      this.socket = new WebSocket(url, subprotocol || this.defaultSubprotocol);

      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = resolve;
      this.socket.onerror = reject;

      this.socket.onmessage = this.onmessage;
    });
  }

  send(packet: any) {
    const bytes = this.encode(packet);
    const buffer = Uint8Array.from(bytes);

    this.emit('packetsend', buffer);

    this.socket.send(buffer);
  }

  close() {
    this.socket.close();
  }

  getWebSocketURL() {
    const { protocol, host, port } = this.options;

    function formatPort() {
      // The default protocol is `ws` which uses port 80.
      if ((!protocol || protocol === 'ws') && port === 80) {
        return '';
      }

      // If the protocol is `wss`, the default protocol is 443.
      if (protocol === 'wss' && port === 443) {
        return '';
      }

      return `:${port}`;
    }

    return `${protocol || 'ws'}://${host}${formatPort()}`;
  }

  onmessage = (msg: MessageEvent) => {
    if (msg.data instanceof ArrayBuffer) {
      const buffer = new Uint8Array(msg.data);

      this.emit('packetreceive', buffer);

      const packet = this.decode(buffer);

      this.emit(packet.type, packet);
    }
  };
}

Client.prototype.defaultSubprotocol = 'mqtt';
Client.prototype.defaultClientIdPrefix = 'wqtt';
