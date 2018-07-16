import fs from 'fs';
import { promisify } from 'util';
import vorpal_ from 'vorpal';
import untildify from 'untildify';
import { connect } from './connect';

const readFile = promisify(fs.readFile);

const vorpal = vorpal_();

const notConnectedPrompt = '(not connected)';

export function run(argv) {
  init(argv);

  vorpal.delimiter(`${notConnectedPrompt}:`).show();
}

function init(argv) {
  let client;
  let logPackets = false;
  let logBytes = false;

  vorpal
    .command('connect', 'Connect to a broker.')
    .option('-h, --host <host>', 'broker host')
    .option('-p, --port <port>', 'broker port')
    .option('--tls', 'use TLS')
    .option('--ca <ca>', 'path to CA certificate')
    .option('-u, --username <username>', 'username')
    .option('-P, --password <password>', 'password')
    .action(async function(args) {
      const host = args.options.host || argv.host || 'localhost';
      const port = args.options.port || argv.port || 1883;

      vorpal.delimiter(`${host}:`);

      this.log(`connecting to host ${host}, port ${port}`);

      client = await connect({
        host,
        port,
        tls: args.options.tls
          ? {
              ca: args.options.ca ? await readFile(untildify(args.options.ca)) : null,
            }
          : false,
        username: args.options.username,
        password: args.options.password,
        logger: msg => {
          if (msg.startsWith('packet ') && !logPackets) {
            return;
          }

          if (msg.startsWith('bytes ') && !logBytes) {
            return;
          }

          if (vorpal.activeCommand) {
            vorpal.activeCommand.log(msg);
          } else {
            vorpal.ui.imprint();
            vorpal.log(msg);
          }
        },
        onmessage(packet) {
          console.log(packet); // eslint-disable-line no-console
        },
      });
    });

  vorpal.command('disconnect', 'Disconnect from broker.').action(function(_args) {
    client.disconnect();

    vorpal.delimiter(`${notConnectedPrompt}:`);
  });

  vorpal
    .command('publish <topic> [msg]', 'Publish to topic.')
    .alias('pub')
    .option('-q, --qos [level]', 'set QoS level')
    .action(async function(args) {
      this.log(`publishing to ${args.topic}`);

      await client.publish(args.topic, args.msg, { qos: +args.options.qos || 0 });
    });

  vorpal
    .command('subscribe <topic>', 'Subscribe to topics.')
    .alias('sub')
    .option('-q, --qos [level]', 'set QoS level')
    .action(async function(args) {
      this.log(`subscribing to ${args.topic}`);

      await client.subscribe(args.topic, +args.options.qos || 0);
    });

  vorpal
    .command('unsubscribe <topic>', 'Unsubscribe from topics.')
    .alias('unsub')
    .action(async function(args) {
      this.log(`unsubscribing from ${args.topic}`);

      client.unsubscribe(args.topic);
    });

  vorpal
    .command('log', 'Get/set logging.')
    .option('--packets', 'log sent and received packets')
    .option('--bytes', 'log sent and received bytes')
    .action(async function(args) {
      if ('packets' in args.options) {
        logPackets = args.options.packets;
      }

      if ('bytes' in args.options) {
        logBytes = args.options.bytes;
      }

      this.log({
        packets: logPackets,
        bytes: logBytes,
      });
    });
}
