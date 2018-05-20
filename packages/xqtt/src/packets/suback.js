// @flow

import { decodeLength } from './helpers';

export default {
  encode(_packet: any) {
    throw new Error('suback.encode is not implemented yet');
  },

  decode(buffer: Uint8Array) {
    const id = (buffer[2] << 8) + buffer[3];

    const remainingLength = decodeLength(buffer, 1);
    const payloadStart = buffer.length - 2 - remainingLength + 2;

    console.log(buffer);
    console.log(buffer.length);
    console.log(remainingLength);
    console.log(payloadStart);

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
