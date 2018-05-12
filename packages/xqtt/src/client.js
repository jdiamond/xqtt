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

  defaultClientIdPrefix: string;

  constructor(options: ClientOptions) {
    this.options = options;

    this.clientId = this.options.clientId || this.generateClientId();
  }

  generateClientId() {
    const prefix = this.options.clientIdPrefix || this.defaultClientIdPrefix;
    const suffix = Math.random()
      .toString(36)
      .slice(2);

    return `${prefix}-${suffix}`;
  }

  connect() {
    throw new Error('not implemented');
  }

  send(_packet: any) {
    throw new Error('not implemented');
  }

  log(...args: any[]): void {
    log(...args);
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
}

Client.prototype.defaultClientIdPrefix = 'xqtt';
