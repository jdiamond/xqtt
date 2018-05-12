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

export type PublishOptions = {
  dup?: boolean,
  qos?: number,
  retain?: boolean,
};

const packetIdLimit = 65536;

export default class Client {
  options: ClientOptions;
  clientId: string;
  connectionState: string;
  lastPacketId: number;

  defaultClientIdPrefix: string;

  constructor(options: ClientOptions) {
    this.options = options;
    this.clientId = this.options.clientId || this.generateClientId();
    this.connectionState = 'not-connected';
    this.lastPacketId = Math.floor(Math.random() * packetIdLimit);
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

  publish(topic: string, payload: any, options: ?PublishOptions) {
    this.lastPacketId = (this.lastPacketId + 1) % packetIdLimit;

    this.send({
      type: 'publish',
      dup: (options && options.dup) || false,
      qos: (options && options.qos) || 0,
      retain: (options && options.retain) || false,
      id: this.lastPacketId,
      topic,
      payload,
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
