/* eslint-disable no-console */

import { Client } from 'nqtt';

export async function connect(options) {
  const { host, port, logger } = options;

  const client = new Client({
    host,
    port,
    packetsend(packet) {
      logEvent(logger, 'packet sent', JSON.stringify(packet));
    },
    packetreceive(packet) {
      logEvent(logger, 'packet received', JSON.stringify(packet));
    },
    bytessent(bytes) {
      logEvent(logger, 'bytes sent', formatBytes(bytes));
    },
    bytesreceived(bytes) {
      logEvent(logger, 'bytes received', formatBytes(bytes));
    },
    statechange(transition) {
      logEvent(logger, 'state changed', `${transition.from} -> ${transition.to}`);
    },
  });

  await client.connect();

  return client;
}

function logEvent(logger, type, msg) {
  logger(`${type}: ${msg}`);
}

function formatBytes(bytes) {
  const preview = bytes.slice(0, 1024);

  return `${hexify(preview)} "${asciify(preview)}"`;
}

function hexify(bytes) {
  return Array.from(bytes)
    .map(b => {
      if (b < 16) {
        return '0' + b.toString(16);
      } else {
        return b.toString(16);
      }
    })
    .join(' ');
}

function asciify(bytes) {
  return Array.from(bytes)
    .map(b => {
      if (b >= 32 && b < 128) {
        return String.fromCharCode(b);
      } else {
        return '.';
      }
    })
    .join('');
}
