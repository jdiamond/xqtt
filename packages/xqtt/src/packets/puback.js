// @flow

export type PubackPacket = {
  type: 'puback',
  id: number,
};

export default {
  encode(_packet: PubackPacket) {
    throw new Error('puback.encode is not implemented yet');
  },

  decode(buffer: Uint8Array): PubackPacket {
    const id = (buffer[2] << 8) + buffer[3];

    return {
      type: 'puback',
      id,
    };
  },
};
