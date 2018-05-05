// @flow

const packetTypes = {
  connect: {
    encode(packet: any) {
      const packetType = 1;
      const flags = 0;

      const fixedHeader = [(packetType << 4) | flags, 0];

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

      fixedHeader[1] = variableHeader.length + payload.length;

      return [...fixedHeader, ...variableHeader, ...payload];
    },

    decode(buffer) {},
  },

  connack: {
    decode(buffer: Uint8Array) {
      const sessionPresent = !!(buffer[2] & 1);
      const returnCode = buffer[3];

      return {
        type: 'connack',
        sessionPresent,
        returnCode,
      };
    },
  },
};

const packetTypesById = {
  '1': 'connect',
  '2': 'connack',
};

function encodeLength(x) {
  const output = [];

  do {
    let encodedByte = x % 128;

    x = x / 128;

    if (x > 0) {
      encodedByte = encodedByte | 128;
    }

    output.push(encodedByte);
  } while (x > 0);

  return output;
}

function encodeUTF8String(str) {
  const bytes = toUTF8Array(str);

  return [bytes.length >> 8, bytes.length & 0xff, ...bytes];
}

// https://stackoverflow.com/a/18729931
function toUTF8Array(str) {
  var utf8 = [];
  for (var i = 0; i < str.length; i++) {
    var charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
}

export function encode(packet: any) {
  return packetTypes[packet.type].encode(packet);
}

export function decode(buffer: Uint8Array) {
  const id = buffer[0] >> 4;
  const packetType = packetTypesById[id];

  return packetTypes[packetType].decode(buffer);
}
