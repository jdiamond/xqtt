// @flow

import { decodeLength } from './helpers';

import connect from './connect';
import connack from './connack';
import publish from './publish';
import puback from './puback';
import pubrec from './pubrec';
import pubrel from './pubrel';
import pubcomp from './pubcomp';
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
import type { PubrecPacket } from './pubrec';
import type { PubrelPacket } from './pubrel';
import type { PubcompPacket } from './pubcomp';
import type { SubscribePacket } from './subscribe';
import type { SubackPacket } from './suback';
import type { UnsubscribePacket } from './unsubscribe';
import type { UnsubackPacket } from './unsuback';
import type { PingreqPacket } from './pingreq';
import type { PingresPacket } from './pingres';
import type { DisconnectPacket } from './disconnect';

export type AnyPacket =
  | ConnectPacket
  | ConnackPacket
  | PublishPacket
  | PubackPacket
  | PubrecPacket
  | PubrelPacket
  | PubcompPacket
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
  pubrec,
  pubrel,
  pubcomp,
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
  pubrec, // 5
  pubrel, // 6
  pubcomp, // 7
  subscribe, // 8
  suback, // 9
  unsubscribe, // 10
  unsuback, // 11
  pingreq, // 12
  pingres, // 13
  disconnect, // 14
];

export function encode(packet: AnyPacket) {
  const name = packet.type;
  const packetType: any = packetTypesByName[name];

  if (!packetType) {
    throw new Error(`packet type ${name} cannot be encoded`);
  }

  return packetType.encode(packet);
}

export function decode(buffer: Uint8Array): ?AnyPacket {
  if (buffer.length < 2) {
    return null;
  }

  const id = buffer[0] >> 4;
  const packetType = packetTypesById[id];

  if (!packetType) {
    throw new Error(`packet type ${id} cannot be decoded`);
  }

  const { length: remainingLength, bytesUsedToEncodeLength } = decodeLength(buffer, 1);

  if (buffer.length < 1 + bytesUsedToEncodeLength + remainingLength) {
    return null;
  }

  return packetType.decode(buffer, remainingLength);
}
