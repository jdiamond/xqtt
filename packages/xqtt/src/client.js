// @flow

import log from './log';
import { encode, decode } from './packets';

import type { AnyPacket } from './packets';
import type { PublishPacket } from './packets/publish';
import type { PubackPacket } from './packets/puback';
import type { PubrecPacket } from './packets/pubrec';
import type { PubrelPacket } from './packets/pubrel';
import type { PubcompPacket } from './packets/pubcomp';
import type { SubackPacket } from './packets/suback';
import type { UnsubackPacket } from './packets/unsuback';

export type ClientOptions = {
  protocol?: string,
  host?: string,
  port?: number,
  clientId?: string,
  clientIdPrefix?: string,
  keepAlive?: number,
  username?: string,
  password?: string,
  connectTimeout?: number,
  reconnect?: boolean | ReconnectOptions,
};

export type ReconnectOptions = {
  random?: boolean,
  factor?: number,
  minTimeout?: number,
  maxTimeout?: number,
};

export type DefaultReconnectOptions = {
  random: boolean,
  factor: number,
  minTimeout: number,
  maxTimeout: number,
};

export type PublishOptions = {
  dup?: boolean,
  qos?: 0 | 1 | 2,
  retain?: boolean,
};

type ConnectionStates =
  | 'never-connected'
  | 'connecting'
  | 'connect-failed'
  | 'connected'
  | 'offline'
  | 'reconnecting'
  | 'disconnecting'
  | 'disconnected';

const packetIdLimit = 2 ** 16;

export default class Client {
  options: ClientOptions;
  clientId: string;
  keepAlive: number;
  connectionState: ConnectionStates;
  reconnectAttempt: number;
  lastPacketId: number;
  lastPacketTime: Date;
  incomingBuffer: ?Uint8Array;
  resolveConnect: any;
  rejectConnect: any;
  connectTimer: any;
  reconnectTimer: any;
  keepAliveTimer: any;

  defaultClientIdPrefix: string;
  defaultConnectTimeout: number;
  defaultKeepAlive: number;
  defaultReconnectOptions: DefaultReconnectOptions;
  log: (...data: any[]) => void;

  constructor(options: ?ClientOptions) {
    this.options = options || {};
    this.clientId = this.options.clientId || this.generateClientId();
    this.keepAlive = this.options.keepAlive || this.defaultKeepAlive;
    this.connectionState = 'never-connected';
    this.reconnectAttempt = 0;
    this.lastPacketId = 0;
  }

  // Public methods

  connect(reconnecting?: boolean) {
    switch (this.connectionState) {
      case 'never-connected':
      case 'connect-failed':
      case 'offline':
      case 'disconnected':
        break;
      default:
        this.log(`should not be connecting in ${this.connectionState} state`);
        return;
    }

    this.changeState(reconnecting ? 'reconnecting' : 'connecting');

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

  disconnect() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

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
    // this.log('connectionOpened');

    this.startConnectTimer();

    this.send({
      type: 'connect',
      clientId: this.clientId,
      keepAlive: this.keepAlive,
      username: this.options.username,
      password: this.options.password,
    });
  }

  connectionClosed() {
    // this.log('connectionClosed');

    switch (this.connectionState) {
      case 'disconnecting':
        this.changeState('disconnected');
        break;
      case 'connected':
        this.changeState('offline');
        this.reconnectAttempt = 0;
        this.startReconnectTimer();
        break;
      case 'connecting':
      case 'reconnecting':
        if (this.connectionState === 'connecting') {
          this.reconnectAttempt = 0;
        } else {
          this.reconnectAttempt++;
        }

        this.changeState('connect-failed');
        this.startReconnectTimer();

        break;
      default:
        this.log(`connection should not be closing in ${this.connectionState} state`);
        break;
    }
  }

  connectionError(error: any) {
    // TODO: decide what to do with this
    this.log('connectionError', error);
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

  // Methods that can be overridden by subclasses, consider protected

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
        this.handleSuback(packet);
        break;
      case 'unsuback':
        this.handleUnsuback(packet);
        break;
    }
  }

  protocolViolation(msg: string) {
    this.log('protocolViolation', msg);
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

  handleSuback(_packet: SubackPacket) {
    // TODO: mark subscription as acknowledged
  }

  handleUnsuback(_packet: UnsubackPacket) {
    // TODO: mark unsubscription as acknowledged
  }

  startConnectTimer() {
    this.connectTimer = setTimeout(() => {
      if (this.connectionState !== 'connected') {
        const wasConnecting = this.connectionState === 'connecting';

        this.changeState('connect-failed');

        if (wasConnecting) {
          this.reconnectAttempt = 0;

          this.rejectConnect(new Error('connect timed out'));
        }

        this.startReconnectTimer();
      } else {
        this.log('connectTimer should have been cancelled');
      }
    }, this.options.connectTimeout || this.defaultConnectTimeout);
  }

  startKeepAliveTimer() {
    const elapsed = new Date() - this.lastPacketTime;
    const timeout = this.keepAlive * 1000 - elapsed;

    this.keepAliveTimer = setTimeout(() => this.sendKeepAlive(), timeout);
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
    } else {
      this.log('keepAliveTimer should have been cancelled');
    }
  }

  startReconnectTimer() {
    const options = this.options;

    if (options.reconnect === false) {
      return;
    }

    const defaultReconnectOptions = this.defaultReconnectOptions;

    const reconnectOptions =
      typeof options.reconnect === 'object' ? options.reconnect : defaultReconnectOptions;

    // https://github.com/tim-kos/node-retry
    // https://dthain.blogspot.com/2009/02/exponential-backoff-in-distributed.html
    const random = 1 + (reconnectOptions.random ? Math.random() : 0);
    const factor = reconnectOptions.factor || defaultReconnectOptions.factor;
    const minTimeout = reconnectOptions.minTimeout || defaultReconnectOptions.minTimeout;
    const maxTimeout = reconnectOptions.maxTimeout || defaultReconnectOptions.maxTimeout;
    const attempt = this.reconnectAttempt;
    const delay = Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout);

    this.log(`reconnecting in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(true);
    }, delay);
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
Client.prototype.defaultConnectTimeout = 30 * 1000;
Client.prototype.defaultKeepAlive = 45;
Client.prototype.defaultReconnectOptions = {
  random: true,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: Infinity,
};
Client.prototype.log = log;
