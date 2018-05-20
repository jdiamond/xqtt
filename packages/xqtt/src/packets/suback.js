// @flow

import { decodeLength } from './helpers';

export type SubackPacket = {
  type: 'suback',
  id: number,
  returnCodes: number[],
};

export default {
  encode(_packet: SubackPacket) {
    throw new Error('suback.encode is not implemented yet');
  },

  decode(buffer: Uint8Array): SubackPacket {
    const id = (buffer[2] << 8) + buffer[3];

    const remainingLength = decodeLength(buffer, 1);
    const payloadStart = buffer.length - remainingLength + 2;

    const returnCodes = [];

    for (let i = payloadStart; i < remainingLength; i++) {
      returnCodes.push(buffer[i]);
    }

    return {
      type: 'suback',
      id,
      returnCodes,
    };
  },
};
