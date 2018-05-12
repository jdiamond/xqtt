// @flow

import connect from './connect';
import connack from './connack';

const packetTypesByName = {
  connect,
  connack,
};

const packetTypesById = {
  '1': 'connect',
  '2': 'connack',
};

export function encode(packet: any) {
  return packetTypesByName[packet.type].encode(packet);
}

export function decode(buffer: Uint8Array) {
  const id = buffer[0] >> 4;
  const packetType = packetTypesById[id];

  return packetTypesByName[packetType].decode(buffer);
}
