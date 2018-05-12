// @flow

import log from './log';
import { encode, decode } from './packets';

export type ClientOptions = {
  protocol?: string,
  host: string,
  port?: number,
  clientId?: string,
  clientIdPrefix?: string,
  packetreceive?: (buffer: Uint8Array) => void,
  packetsend?: (buffer: Uint8Array) => void,
  connack?: (packet: any) => void,
};

export default class Client {
  options: ClientOptions;
  clientId: string;
  connectionState: string;

  defaultClientIdPrefix: string;

  constructor(options: ClientOptions) {
    this.options = options;
    this.clientId = this.options.clientId || this.generateClientId();
    this.connectionState = 'not-connected';
  }

  // Connection methods

  async open() {
    throw new Error('not implemented');
  }

  async send(_packet: any) {
    throw new Error('not implemented');
  }

  async close() {
    throw new Error('not implemented');
  }

  // Packet methods

  async connect() {
    if (this.connectionState === 'connected') {
      throw new Error('already connected');
    }

    await this.open();

    this.connectionState = 'connected';

    this.send({
      type: 'connect',
      clientId: this.clientId,
    });
  }

  async disconnect() {
    await this.send({ type: 'disconnect' });

    this.connectionState = 'disconnected';
  }

  // Utility methods

  generateClientId() {
    const prefix = this.options.clientIdPrefix || this.defaultClientIdPrefix;
    const suffix = Math.random()
      .toString(36)
      .slice(2);

    return `${prefix}-${suffix}`;
  }

  encode(packet: any) {
    return encode(packet);
  }

  decode(bytes: any) {
    return decode(bytes);
  }

  emit(event: string, data: any) {
    if (typeof this.options[event] === 'function') {
      this.options[event](data);
    }
  }

  log(...args: any[]): void {
    log(...args);
  }
}

Client.prototype.defaultClientIdPrefix = 'xqtt';
