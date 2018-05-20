// @flow

export default {
  encode(_packet: any) {
    throw new Error('puback.encode is not implemented yet');
  },

  decode(buffer: Uint8Array) {
    const id = (buffer[2] << 8) + buffer[3];

    return {
      type: 'puback',
      id,
    };
  },
};
