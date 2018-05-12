// @flow

import { encodeUTF8String, encodeLength } from './helpers';

export default {
  encode(packet: any) {
    const packetType = 1;
    const flags = 0;

    const protocolName = encodeUTF8String('MQTT');
    const protocolLevel = 4;

    const usernameFlag = !!packet.username;
    const passwordFlag = !!packet.password;
    const willRetain = !!(packet.will && packet.will.retain);
    const willQoS = (packet.will && packet.will.qos) || 0;
    const willFlag = !!packet.will;
    const cleanSession = packet.clean || typeof packet.clean === 'undefined';
    const connectFlags =
      (usernameFlag ? 128 : 0) +
      (passwordFlag ? 64 : 0) +
      (willRetain ? 32 : 0) +
      (willQoS & 2 ? 16 : 0) +
      (willQoS & 1 ? 8 : 0) +
      (willFlag ? 4 : 0) +
      (cleanSession ? 2 : 0);

    const keepAlive = typeof packet.keepAlive !== 'undefined' ? packet.keepAlive : 0;

    const variableHeader = [
      ...protocolName,
      protocolLevel,
      connectFlags,
      keepAlive >> 8,
      keepAlive & 0xff,
    ];

    const payload = [...encodeUTF8String(packet.clientId)];

    if (usernameFlag) {
      payload.push(...encodeUTF8String(packet.username));
    }

    if (passwordFlag) {
      payload.push(...encodeUTF8String(packet.password));
    }

    const fixedHeader = [
      (packetType << 4) | flags,
      ...encodeLength(variableHeader.length + payload.length),
    ];

    return [...fixedHeader, ...variableHeader, ...payload];
  },
};