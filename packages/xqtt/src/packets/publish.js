// @flow

import {
  encodeLength,
  encodeUTF8String,
  toUTF8Array,
  decodeLength,
  decodeUTF8String,
} from './helpers';

export type PublishPacket = {
  type: 'publish',
  id?: ?number,
  topic: string,
  payload: any,
  dup?: boolean,
  qos?: 0 | 1 | 2,
  retain?: boolean,
};

export default {
  encode(packet: PublishPacket) {
    const packetType = 3;

    const qos = packet.qos || 0;

    const flags =
      (packet.dup ? 8 : 0) +
      (qos & 2 ? 4 : 0) +
      (qos & 1 ? 2 : 0) +
      (packet.retain ? 1 : 0);

    const variableHeader = [...encodeUTF8String(packet.topic)];

    if (qos > 0) {
      if (typeof packet.id !== 'number' || packet.id < 0 || packet.id > 2) {
        throw new Error('qos must be 0, 1, or 2');
      }

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

  decode(buffer: Uint8Array): PublishPacket {
    const flags = buffer[0] & 0x0f;

    const dup = !!(flags & 8);
    const qos = (flags & 6) >> 1;
    const retain = !!(flags & 1);

    if (qos !== 0 && qos !== 1 && qos !== 2) {
      throw new Error('invalid qos');
    }

    const remainingLength = decodeLength(buffer, 1);

    const topicStart = buffer.length - remainingLength;
    const decodedTopic = decodeUTF8String(buffer, topicStart);
    const topic = decodedTopic.value;

    let id = null;
    let payloadStart = topicStart + decodedTopic.length;

    if (qos > 0) {
      const idStart = payloadStart;

      id = (buffer[idStart] << 8) + buffer[idStart + 1];

      payloadStart += 2;
    }

    const payload = buffer.slice(payloadStart);

    return {
      type: 'publish',
      dup,
      qos,
      retain,
      id,
      topic,
      payload,
    };
  },
};
