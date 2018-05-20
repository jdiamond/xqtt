// @flow

import connect from './connect';
import connack from './connack';
import publish from './publish';
import puback from './puback';
import subscribe from './subscribe';
import suback from './suback';
import unsubscribe from './unsubscribe';
import unsuback from './unsuback';
import pingreq from './pingreq';
import pingres from './pingres';
import disconnect from './disconnect';

import type { ConnectPacket } from './connect';
import type { ConnackPacket } from './connack';
import type { PublishPacket } from './publish';
import type { PubackPacket } from './puback';
import type { SubscribePacket } from './subscribe';
import type { SubackPacket } from './suback';
import type { UnsubscribePacket } from './unsubscribe';
import type { UnsubackPacket } from './unsuback';
import type { PingreqPacket } from './pingreq';
import type { PingresPacket } from './pingres';
import type { DisconnectPacket } from './disconnect';

export type PacketTypes =
  | ConnectPacket
  | ConnackPacket
  | PublishPacket
  | PubackPacket
  | SubscribePacket
  | SubackPacket
  | UnsubscribePacket
  | UnsubackPacket
  | PingreqPacket
  | PingresPacket
  | DisconnectPacket;

const packetTypesByName = {
  connect,
  connack,
  publish,
  puback,
  subscribe,
  suback,
  unsubscribe,
  unsuback,
  pingreq,
  pingres,
  disconnect,
};

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
  unsubscribe, // 10
  unsuback, // 11
  pingreq, // 12
  pingres, // 13
  disconnect, // 14
];

export function encode(packet: PacketTypes) {
  const name = packet.type;
  const packetType: any = packetTypesByName[name];

  if (!packetType) {
    throw new Error(`packet type ${name} cannot be encoded`);
  }

  return packetType.encode(packet);
}

export function decode(buffer: Uint8Array): PacketTypes {
  const id = buffer[0] >> 4;
  const packetType = packetTypesById[id];

  if (!packetType) {
    throw new Error(`packet type ${id} cannot be decoded`);
  }

  return packetType.decode(buffer);
}
