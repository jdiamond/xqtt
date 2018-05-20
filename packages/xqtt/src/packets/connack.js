// @flow

export type ConnackPacket = {
  type: 'connack',
  sessionPresent: boolean,
  returnCode: number,
};

export default {
  encode(_packet: ConnackPacket) {
    throw new Error('connack.encode is not implemented yet');
  },

  decode(buffer: Uint8Array): ConnackPacket {
    const sessionPresent = !!(buffer[2] & 1);
    const returnCode = buffer[3];

    return {
      type: 'connack',
      sessionPresent,
      returnCode,
    };
  },
};
