// @flow

import log from './log';
import { encode, decode } from './packets';

import type { PacketTypes } from './packets';

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
  qos?: 0 | 1 | 2,
  retain?: boolean,
};

type ConnectionStates =
  | 'never-connected'
  | 'connecting'
  | 'connect-failed-retrying'
  | 'connect-failed'
  | 'connected'
  | 'offline'
  | 'offline-reconnecting'
  | 'reconnecting'
  | 'reconnect-failed-retrying'
  | 'reconnect-failed'
  | 'disconnecting'
  | 'disconnected';

const packetIdLimit = 2 ** 16;

export default class Client {
  options: ClientOptions;
  clientId: string;
  connectionState: ConnectionStates;
  lastPacketId: number;
  resolveConnect: any;
  rejectConnect: any;

  defaultClientIdPrefix: string;
  log: (...data: any[]) => void;

  constructor(options: ClientOptions) {
    this.options = options;
    this.clientId = this.options.clientId || this.generateClientId();
    this.connectionState = 'never-connected';
    this.lastPacketId = 0;
  }

  // Connection methods implemented by subclasses, consider abtstract and protected

  open() {
    throw new Error('not implemented');
  }

  write(_bytes: Uint8Array | number[]) {
    throw new Error('not implemented');
  }

  close() {
    throw new Error('not implemented');
  }

  // Connection methods invoked by subclasses, consider protected

  connectionOpened() {
    this.send({
      type: 'connect',
      clientId: this.clientId,
    });
  }

  connectionClosed() {
    switch (this.connectionState) {
      case 'disconnecting':
        this.changeState('disconnected');
        break;
      default:
        this.log(`connection should not be closing in ${this.connectionState} state`);
        return;
    }
  }

  connectionError(error: any) {
    this.log(error);
  }

  bytesReceived(buffer: Uint8Array) {
    // This is assuming all the bytes for a complete message are available.
    // We can't rely on that.
    const packet = this.decode(buffer);

    this.packetReceived(packet);
  }

  packetReceived(packet: any) {
    this.emit('packetreceive', packet);

    switch (packet.type) {
      case 'connack':
        this.handleConnack();
        break;
      case 'publish':
        // TODO: if qos === 1, send puback
        // TODO: if qos === 2, send pubrec
        break;
      case 'puback':
        // TODO: mark inflight qos 1 message as ack'ed
        break;
      case 'pubrec':
        // TODO: send pubrel
        break;
      case 'pubrel':
        // TODO: send pubcomp
        break;
      case 'pubcomp':
        // TODO: mark inflight qos 2 messages as complete
        break;
      case 'suback':
        // TODO: mark inflight subscription request as ack'ed
        break;
    }

    this.emit(packet.type, packet);
  }

  handleConnack() {
    switch (this.connectionState) {
      case 'connecting':
      case 'reconnecting':
        break;
      default:
        this.log(`should not be receiving connack packets in ${this.connectionState} state`);
        return;
    }

    this.changeState('connected');

    if (this.resolveConnect) {
      this.resolveConnect(this);
    }
  }

  // Public methods

  async connect() {
    switch (this.connectionState) {
      case 'never-connected':
      case 'connect-failed':
      case 'reconnect-failed':
      case 'offline':
      case 'disconnected':
        break;
      default:
        this.log(`should not be connecting in ${this.connectionState} state`);
        return;
    }

    this.changeState('connecting');

    return new Promise((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;

      this.open();
    });
  }

  publish(topic: string, payload: any, options: ?PublishOptions) {
    switch (this.connectionState) {
      case 'connected':
        break;
      default:
        this.log(`should not be publishing in ${this.connectionState} state`);
        return;
    }

    const qos = (options && options.qos) || 0;
    const id = qos > 0 ? this.nextPacketId() : null;

    this.send({
      type: 'publish',
      dup: (options && options.dup) || false,
      qos,
      retain: (options && options.retain) || false,
      id,
      topic,
      payload,
    });
  }

  subscribe(topic: string, qos: ?(0 | 1 | 2)) {
    switch (this.connectionState) {
      case 'connected':
        break;
      default:
        this.log(`should not be subscribing in ${this.connectionState} state`);
        return;
    }

    this.send({
      type: 'subscribe',
      id: this.nextPacketId(),
      subscriptions: [{ topic, qos: qos || 0 }],
    });
  }

  async disconnect() {
    switch (this.connectionState) {
      case 'connected':
        break;
      default:
        this.log(`should not be disconnecting in ${this.connectionState} state`);
        return;
    }

    this.changeState('disconnecting');

    this.send({ type: 'disconnect' });
  }

  // Utility methods

  changeState(newState: ConnectionStates) {
    const oldState = this.connectionState;

    this.connectionState = newState;

    this.emit('statechange', { from: oldState, to: newState });

    this.emit(newState);
  }

  generateClientId() {
    const prefix = this.options.clientIdPrefix || this.defaultClientIdPrefix;
    const suffix = Math.random()
      .toString(36)
      .slice(2);

    return `${prefix}-${suffix}`;
  }

  nextPacketId() {
    this.lastPacketId = (this.lastPacketId + 1) % packetIdLimit;

    // Don't allow packet id to be 0.
    if (!this.lastPacketId) {
      this.lastPacketId = 1;
    }

    return this.lastPacketId;
  }

  send(packet: PacketTypes) {
    this.emit('packetsend', packet);

    const bytes = this.encode(packet);

    this.write(bytes);
  }

  encode(packet: PacketTypes) {
    return encode(packet);
  }

  decode(bytes: any): PacketTypes {
    return decode(bytes);
  }

  emit(event: string, data: any) {
    if (typeof this.options[event] === 'function') {
      this.options[event](data);
    }
  }
}

Client.prototype.defaultClientIdPrefix = 'xqtt';
Client.prototype.log = log;
