// @flow

export type PingresPacket = {
  type: 'pingres',
};

export default {
  encode(_packet: PingresPacket) {
    throw new Error('pingres.encode is not implemented yet');
  },

  decode(_buffer: Uint8Array): PingresPacket {
    return {
      type: 'pingres',
    };
  },
};
