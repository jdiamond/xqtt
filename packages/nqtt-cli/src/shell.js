import vorpal_ from 'vorpal';
import { connect } from './connect';

const vorpal = vorpal_();

export function run(argv) {
  init(argv);

  vorpal.delimiter('nqtt$').show();
}

function init(argv) {
  let client;
  let logPackets = false;
  let logBytes = false;

  vorpal
    .command('connect', 'Connect to a broker.')
    .option('-h, --host', 'broker host')
    .option('-p, --port', 'broker port')
    .option('--tls', 'use TLS')
    .option('--ca', 'path to CA certificate')
    .action(async function(args) {
      const host = args.options.host || argv.host || 'localhost';
      const port = args.options.port || argv.port || 1883;

      this.log(`connecting to host ${host}, port ${port}`);

      client = await connect({
        host,
        port,
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
      });
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
