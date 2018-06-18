// @flow

import log from './log';
import { encode, decode } from './packets';

import type { AnyPacket } from './packets';
import type { PublishPacket } from './packets/publish';
import type { PubackPacket } from './packets/puback';
import type { PubrecPacket } from './packets/pubrec';
import type { PubrelPacket } from './packets/pubrel';
import type { PubcompPacket } from './packets/pubcomp';

export type ClientOptions = {
  protocol?: string,
  host: string,
  port?: number,
  clientId?: string,
  clientIdPrefix?: string,
  keepAlive?: number,
  username?: string,
  password?: string,
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
  keepAlive: number;
  connectionState: ConnectionStates;
  lastPacketId: number;
  lastPacketTime: Date;
  incomingBuffer: ?Uint8Array;
  resolveConnect: any;
  rejectConnect: any;

  defaultClientIdPrefix: string;
  defaultKeepAlive: number;
  log: (...data: any[]) => void;

  constructor(options: ClientOptions) {
    this.options = options;
    this.clientId = this.options.clientId || this.generateClientId();
    this.keepAlive = this.options.keepAlive || this.defaultKeepAlive;
    this.connectionState = 'never-connected';
    this.lastPacketId = 0;
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
    const id = qos > 0 ? this.nextPacketId() : 0;

    this.send({
      type: 'publish',
      dup: (options && options.dup) || false,
      retain: (options && options.retain) || false,
      topic,
      payload,
      qos,
      id,
    });

    // TODO: if qos > 0, message needs to be ack'ed
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

  unsubscribe(topic: string) {
    switch (this.connectionState) {
      case 'connected':
        break;
      default:
        this.log(`should not be unsubscribing in ${this.connectionState} state`);
        return;
    }

    this.send({
      type: 'unsubscribe',
      id: this.nextPacketId(),
      topics: [topic],
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

    this.close();
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
      keepAlive: this.keepAlive,
      username: this.options.username,
      password: this.options.password,
    });
  }

  connectionClosed() {
    switch (this.connectionState) {
      case 'disconnecting':
        this.changeState('disconnected');
        break;
      case 'connected':
        // TODO: start reconnecting
        this.changeState('offline');
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
    this.emit('bytesreceived', buffer);

    const bytes = this.incomingBuffer
      ? Uint8Array.from([...this.incomingBuffer, ...buffer])
      : buffer;

    const packet = this.decode(bytes);

    if (packet) {
      this.packetReceived(packet);

      this.incomingBuffer = null;
    } else {
      this.incomingBuffer = bytes;
    }
  }

  packetReceived(packet: AnyPacket) {
    this.emit('packetreceive', packet);

    switch (packet.type) {
      case 'connack':
        this.handleConnack();
        break;
      case 'publish':
        this.handlePublish(packet);
        break;
      case 'puback':
        this.handlePuback(packet);
        break;
      case 'pubrec':
        this.handlePubrec(packet);
        break;
      case 'pubrel':
        this.handlePubrel(packet);
        break;
      case 'pubcomp':
        this.handlePubcomp(packet);
        break;
      case 'suback':
        // TODO: mark inflight subscription request as ack'ed
        break;
      case 'unsuback':
        // TODO: mark inflight unsubscription request as ack'ed
        break;
    }

    this.emit(packet.type, packet);
  }

  protocolViolation(msg: string) {
    this.log(msg);
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

    const wasConnecting = this.connectionState === 'connecting';

    this.changeState('connected');

    if (wasConnecting && this.resolveConnect) {
      this.resolveConnect(this);
    }

    this.startKeepAliveTimer();
  }

  handlePublish(packet: PublishPacket) {
    if (packet.qos === 1) {
      if (typeof packet.id !== 'number' || packet.id < 1) {
        return this.protocolViolation('publish packet with qos 1 is missing id');
      }

      this.send({
        type: 'puback',
        id: packet.id,
      });
    } else if (packet.qos === 2) {
      if (typeof packet.id !== 'number' || packet.id < 1) {
        return this.protocolViolation('publish packet with qos 2 is missing id');
      }

      this.send({
        type: 'pubrec',
        id: packet.id,
      });
    }
  }

  handlePuback(_packet: PubackPacket) {
    // TODO: mark message as acknowledged
  }

  handlePubrec(packet: PubrecPacket) {
    // TODO: mark message as received
    this.send({
      type: 'pubrel',
      id: packet.id,
    });
  }

  handlePubrel(packet: PubrelPacket) {
    // TODO: mark message as released
    this.send({
      type: 'pubcomp',
      id: packet.id,
    });
  }

  handlePubcomp(_packet: PubcompPacket) {
    // TODO: mark message as completely acknowledged
  }

  startKeepAliveTimer() {
    const elapsed = new Date() - this.lastPacketTime;
    const timeout = this.keepAlive * 1000 - elapsed;

    setTimeout(() => this.sendKeepAlive(), timeout);
  }

  sendKeepAlive() {
    if (this.connectionState === 'connected') {
      const elapsed = new Date() - this.lastPacketTime;
      const timeout = this.keepAlive * 1000;

      if (elapsed >= timeout) {
        this.send({
          type: 'pingreq',
        });
      }

      this.startKeepAliveTimer();
    }
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

  send(packet: AnyPacket) {
    this.emit('packetsend', packet);

    const bytes = this.encode(packet);

    this.emit('bytessent', bytes);

    this.write(bytes);

    this.lastPacketTime = new Date();
  }

  encode(packet: AnyPacket) {
    return encode(packet);
  }

  decode(bytes: any): ?AnyPacket {
    return decode(bytes);
  }

  emit(event: string, data: any) {
    if (typeof this.options[event] === 'function') {
      this.options[event](data);
    }
  }
}

Client.prototype.defaultClientIdPrefix = 'xqtt';
Client.prototype.defaultKeepAlive = 45;
Client.prototype.log = log;
