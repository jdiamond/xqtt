import vorpal_ from 'vorpal';
import { connect } from './connect';

const vorpal = vorpal_();

export function run(argv) {
  init(argv);

  vorpal.delimiter('nqtt$').show();
}

function init(argv) {
  let client;

  vorpal
    .command('connect', 'Connect to a broker.')
    .option('-h, --host', 'Broker host.')
    .option('-p, --port', 'Broker port.')
    .option('--tls', 'Use TLS.')
    .option('--ca', 'Path to CA certificate.')
    .action(async function(args) {
      const host = args.options.host || argv.host || 'localhost';
      const port = args.options.port || argv.port || 1883;

      this.log(`connecting to host ${host}, port ${port}`);

      client = await connect({
        host,
        port,
      });
    });

  vorpal
    .command('publish <topic> [msg]', 'Publish to topic.')
    .alias('pub')
    .option('-q, --qos [level]', 'Sets QoS level.')
    .action(async function(args) {
      this.log(`publishing to ${args.topic}`);

      await client.publish(args.topic, args.msg, { qos: +args.options.qos || 0 });
    });

  vorpal
    .command('subscribe <topic>', 'Subscribe to topics.')
    .alias('sub')
    .option('-q, --qos [level]', 'Sets QoS level.')
    .action(async function(args) {
      this.log(`subscribing to ${args.topic}`);

      await client.subscribe(args.topic, +args.options.qos || 0);
    });
}
