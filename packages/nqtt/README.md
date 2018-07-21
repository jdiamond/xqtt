# nqtt

MQTT client for Node.js. See wqtt for a MQTT-over-WebSockets client suitable for
use in Web Browsers. Uses xqtt.

## Example

```
const { Client } = require('nqtt');

const client = new Client({
  host: 'localhost',
  port: 1883,
});

client.connect();

client.subscribe('topic/#', packet => {
  console.log(packet.topic);
  console.log(packet.payload);
});

client.publish('topic/name', 'payload');

client.disconnect();
```

## API

### Client

#### constructor

```
new Client(options)
```

Options:

- `host`: host name or IP address of broker (default: "localhost")
- `port`: port to connect on (default: 1883)
- `tls`: use TLS (default: false)
- `ca`: CA certificate
- `clientId`: fixed client ID or function to generate one (default: "nqtt-" + random ID)
- `keepAlive`: keep alive timeout in seconds (default: 45)
- `username`: MQTT username
- `password`: MQTT password
- `connectTimeout`: how many ms to wait for new connections to be acknowledged (default: 30000)
- `reconnect`: `true` to reconnect with the default reconnect options or an object containing custom options

Reconnect options:

- `min`: initial reconnect timeout in ms (default: 1000)
- `factor`: exponential backoff factor (default: 2)
- `random`: add randomization to reconnect timeouts (default: true)
- `max`: max reconnect timeout in ms (default: 60000)
- `attempts`: max reconnects to attempt (default: Infinity)

#### connect

```
await client.connect()
```

This method resolves when the client receives a `CONNACK` packet. When
`reconnect` is false, it rejects on the first failed connection attempt.
Otherwise, it rejects after the number of reconnection attempts exceeds
`reconnect.attempts` (default: Infinity).

The promise returned by this method does not reject after successfully
connecting and then losing that connection. The first successful connection
resolves the promise. To be notified when a connection is lost, use X event.

#### publish

```
await client.publish(topic, payload, options)
```

Options:

- `qos`: QoS level (default: 0)
- `retain`: message should be retained (default: false)
- `dup`: indicate message is duplicate (default: false)

When `qos` is 0, this method resolves immediately. When 1 or 2, it resolves
after the message has been acknowledged.

#### subscribe

```
await client.subscribe(topic)
await client.subscribe(topic, qos)
```

This method resolves when the `SUBSCRIBE` packet is acknowledged with the list
of return codes for each topic.

#### unsubscribe

```
await client.unsubscribe(topic)
```

This method resolves when the `UNSUBSCRIBE` packet is acknowledged.

#### disconnect

```
client.disconnect()
```
