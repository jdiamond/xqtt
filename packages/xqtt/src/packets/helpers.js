// @flow

export function encodeLength(x: number) {
  const output = [];

  do {
    let encodedByte = x % 128;

    x = Math.floor(x / 128);

    if (x > 0) {
      encodedByte = encodedByte | 128;
    }

    output.push(encodedByte);
  } while (x > 0);

  return output;
}

export function decodeLength(buffer: Uint8Array, startIndex: number) {
  let i = startIndex;
  let encodedByte = 0;
  let value = 0;
  let multiplier = 1;

  do {
    encodedByte = buffer[i++];

    value += (encodedByte & 127) * multiplier;

    multiplier *= 128;

    if (multiplier > 128 * 128 * 128) {
      throw Error('malformed length');
    }
  } while ((encodedByte & 128) != 0);

  return value;
}

export function encodeUTF8String(str: string) {
  const bytes = toUTF8Array(str);

  return [bytes.length >> 8, bytes.length & 0xff, ...bytes];
}

// https://stackoverflow.com/a/18729931
export function toUTF8Array(str: string) {
  var utf8 = [];
  for (var i = 0; i < str.length; i++) {
    var charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // surrogate pair
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
