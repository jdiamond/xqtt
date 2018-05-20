// @flow

import { encodeLength, encodeUTF8String, toUTF8Array } from './helpers';

type PublishPacket = {
  id: number,
  topic: string,
  payload: any,
  dup: boolean,
  qos: 0 | 1 | 2,
  retain: boolean,
};

export default {
  encode(packet: PublishPacket) {
    const packetType = 3;
    const flags =
      (packet.dup ? 8 : 0) +
      (packet.qos & 2 ? 4 : 0) +
      (packet.qos & 1 ? 2 : 0) +
      (packet.retain ? 1 : 0);

    const variableHeader = [...encodeUTF8String(packet.topic)];

    if (packet.qos > 0) {
      variableHeader.push(packet.id >> 8, packet.id & 0xff);
    }

    let payload = packet.payload;

    if (typeof payload === 'string') {
      payload = toUTF8Array(payload);
    }

    const fixedHeader = [
      (packetType << 4) | flags,
      ...encodeLength(variableHeader.length + payload.length),
    ];

    return [...fixedHeader, ...variableHeader, ...payload];
  },

  decode(_buffer: Uint8Array) {
    throw new Error('publish.decode is not implemented yet');
  },
};
