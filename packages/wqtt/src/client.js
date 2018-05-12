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

  connect() {
    const url = this.getWebSocketURL();

    const { subprotocol } = this.options;

    this.socket = new WebSocket(url, subprotocol || this.defaultSubprotocol);

    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = this.onopen;
    this.socket.onmessage = this.onmessage;
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

  onopen = () => {
    this.log('connected');

    this.send({
      type: 'connect',
      clientId: this.clientId,
    });
  };

  onmessage = (msg: MessageEvent) => {
    if (msg.data instanceof ArrayBuffer) {
      const buffer = new Uint8Array(msg.data);

      this.emit('packetreceive', buffer);

      const packet = this.decode(buffer);

      this.emit(packet.type, packet);
    }
  };

  send(packet: any) {
    const bytes = this.encode(packet);
    const buffer = Uint8Array.from(bytes);

    this.emit('packetsend', buffer);

    this.socket.send(buffer);
  }

  emit(event: string, data: any) {
    if (typeof this.options[event] === 'function') {
      this.options[event](data);
    }
  }
}

Client.prototype.defaultSubprotocol = 'mqtt';
Client.prototype.defaultClientIdPrefix = 'wqtt';
