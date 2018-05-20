// @flow

import connect from './connect';
import connack from './connack';
import publish from './publish';
import puback from './puback';
import disconnect from './disconnect';

const packetTypesByName = {
  connect,
  connack,
  publish,
  puback,
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
  null,
  null,
  null,
  null,
  null,
  null,
  disconnect,
];

export function encode(packet: any) {
  return packetTypesByName[packet.type].encode(packet);
}

export function decode(buffer: Uint8Array) {
  const id = buffer[0] >> 4;
  const packetType = packetTypesById[id];

  if (!packetType) {
    throw new Error(`packetType ${id} is not supported yet`);
  }

  return packetType.decode(buffer);
}
