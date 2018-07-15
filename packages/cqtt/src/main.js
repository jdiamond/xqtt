/* eslint-disable no-console */

import fs from 'fs';
import { promisify } from 'util';
import yargs from 'yargs';
import { connect } from './connect';
import { run } from './shell';

const readFile = promisify(fs.readFile);

main().catch(error => {
  console.error(error);
  process.exit(1);
});

async function main() {
  let commandFound = false;

  const argv = yargs
    .scriptName('cqtt')
    .usage('$0 [options] [publish|subscribe]')
    .option('host', {
      alias: 'h',
      type: 'string',
      describe: 'Broker host',
      default: 'localhost',
    })
    .option('port', {
      alias: 'p',
      type: 'number',
      describe: 'Broker port',
      default: 1883,
    })
    .option('tls', {
      type: 'boolean',
      describe: 'Use TLS',
      default: false,
    })
    .option('ca', {
      type: 'string',
      describe: 'Path to CA certificate',
    })
    .option('username', {
      alias: 'u',
      type: 'string',
      describe: 'Username',
    })
    .option('password', {
      alias: 'P',
      type: 'string',
      describe: 'Password',
    })
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      describe: 'Enable debug logging',
    })
    .command(
      'publish',
      'publish a message to a topic',
      {
        topic: {
          alias: 't',
          type: 'string',
          describe: 'Topic to publish to',
          demandOption: true,
        },
        message: {
          alias: 'm',
          type: 'string',
          describe: 'Message payload',
        },
        file: {
          alias: 'f',
          type: 'string',
          describe: 'Read message from file',
        },
        stdin: {
          alias: 's',
          type: 'boolean',
          describe: 'Read message payload from stdin',
        },
        qos: {
          alias: 'q',
          type: 'number',
          describe: 'QoS level to publish with',
          default: 0,
        },
      },
      async argv => {
        commandFound = true;

        const client = await connect(await getConnectArgs(argv));

        await client.publish(argv.topic, argv.message);

        await client.disconnect();
      }
    )
    .command(
      'subscribe',
      'Subscribe to topics',
      {
        topic: {
          alias: 't',
          type: 'string',
          describe: 'Topic pattern to subscribe to',
          demandOption: true,
        },
        qos: {
          alias: 'q',
          type: 'number',
          describe: 'QoS level to subscribe with',
          default: 0,
        },
      },
      async argv => {
        commandFound = true;
        console.log(argv);
      }
    ).argv;

  if (!commandFound) {
    run(argv);
  }
}

async function getConnectArgs(argv) {
  const tls = argv.tls
    ? {
        ca: await readFile(argv.ca),
      }
    : false;

  return {
    host: argv.host,
    port: argv.port,
    tls,
    username: argv.username,
    password: argv.password,
    logger: argv.debug ? console.error.bind(console) : () => null,
  };
}
