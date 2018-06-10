// @flow

export type PingresPacket = {
  type: 'pingres',
};

export default {
  encode(_packet: PingresPacket) {
    throw new Error('pingres.encode is not implemented yet');
  },

  decode(_buffer: Uint8Array, _remainingLength: number): PingresPacket {
    return {
      type: 'pingres',
    };
  },
};
