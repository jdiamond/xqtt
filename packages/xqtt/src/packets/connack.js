// @flow

export default {
  encode(_packet: any) {
    throw new Error('connack.encode is not implemented yet');
  },

  decode(buffer: Uint8Array) {
    const sessionPresent = !!(buffer[2] & 1);
    const returnCode = buffer[3];

    return {
      type: 'connack',
      sessionPresent,
      returnCode,
    };
  },
};
