// @flow

import connect from './connect';
import connack from './connack';
import publish from './publish';
import puback from './puback';
import subscribe from './subscribe';
import suback from './suback';
import disconnect from './disconnect';

import type { ConnectPacket } from './connect';
import type { ConnackPacket } from './connack';
import type { PublishPacket } from './publish';
import type { PubackPacket } from './puback';
import type { SubscribePacket } from './subscribe';
import type { SubackPacket } from './suback';
import type { DisconnectPacket } from './disconnect';

export type PacketTypes =
  | ConnectPacket
  | ConnackPacket
  | PublishPacket
  | PubackPacket
  | SubscribePacket
  | SubackPacket
  | DisconnectPacket;

const packetTypesById = [
  null,
  connect, // 1
  connack, // 2
  publish, // 3
  puback, // 4
  null,
  null,
  null,
  subscribe, // 8
  suback, // 9
  null,
  null,
  null,
  null,
  disconnect,
];

export function encode(packet: PacketTypes) {
  switch (packet.type) {
    case 'connect':
      return connect.encode(packet);
    case 'connack':
      return connack.encode(packet);
    case 'publish':
      return publish.encode(packet);
    case 'puback':
      return puback.encode(packet);
    case 'subscribe':
      return subscribe.encode(packet);
    case 'suback':
      return suback.encode(packet);
    case 'disconnect':
      return disconnect.encode(packet);
    default:
      throw new Error(`packet type ${packet.type} cannot be encoded`);
  }
}

export function decode(buffer: Uint8Array): PacketTypes {
  const id = buffer[0] >> 4;
  const packetType = packetTypesById[id];

  if (!packetType) {
    throw new Error(`packet type ${id} cannot be decoded`);
  }

  return packetType.decode(buffer);
}
