/* eslint-disable no-console */

const { Client } = require('./lib');

main().catch(error => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 1883,
    packetsend(packet) {
      logEvent('packet sent', JSON.stringify(packet));
    },
    packetreceive(packet) {
      logEvent('packet received', JSON.stringify(packet));
    },
    bytessent(bytes) {
      logEvent('bytes sent', formatBytes(bytes));
    },
    bytesreceived(bytes) {
      logEvent('bytes received', formatBytes(bytes));
    },
    statechange(transition) {
      logEvent('state changed', `${transition.from} -> ${transition.to}`);
    },
  });

  await client.connect();

  console.log('connected');
}

function logEvent(type, msg) {
  console.log(`${type}: ${msg}`);
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
