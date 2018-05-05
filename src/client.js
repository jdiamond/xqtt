// @flow

import log from './log';
import { encode, decode } from './packet';

type ClientOptions = {
  protocol?: string,
  host: string,
  port?: number,
  subprotocol?: string,
  clientId?: string,
  packetreceive?: (buffer: Uint8Array) => void,
  packetsend?: (buffer: Uint8Array) => void,
  connack?: (packet: any) => void,
};

export default class Client {
  options: ClientOptions;
  socket: WebSocket;
  clientId: string;

  constructor(options: ClientOptions) {
    this.options = options;

    this.clientId = this.options.clientId || this.generateClientId();
  }

  generateClientId() {
    return 'wqtt-' + (1000000 + Math.floor(Math.random() * 10000000));
  }

  connect() {
    const { protocol, host, port, subprotocol } = this.options;

    const url = `${protocol || 'ws'}://${host}${port ? ':' + port : ''}`;

    const socket = new WebSocket(url, subprotocol || 'mqtt');

    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      log('connected');

      this.send({
        type: 'connect',
        clientId: this.clientId,
      });
    };

    socket.onmessage = (msg: MessageEvent) => {
      if (msg.data instanceof ArrayBuffer) {
        var buffer = new Uint8Array(msg.data);
        this.emit('packetreceive', buffer);
        const packet = decode(buffer);
        this.emit(packet.type, packet);
      }
    };

    this.socket = socket;
  }

  send(packet: any) {
    const bytes = encode(packet);
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
