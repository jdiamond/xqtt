This project is a collection of MQTT clients.

- nqtt: MQTT client library for "server-side" Node.js apps
- wqtt: MQTT-over-WebSockets client library for "client-side" Web apps
- xqtt: cross-platform core for nqtt and wqtt

Run tests for all packages like this:

```
yarn run test
```

Build all packages like this:

```
yarn run build
```

During development, run each of these commands in their own shells:

```
yarn workspace xqtt run babel:watch
yarn workspace nqtt run babel:watch
yarn workspace xqtt run jest:watch
yarn workspace nqtt run jest:watch
yarn workspace wqtt run jest:watch
```

To run the wqtt example "app" in a Web browser, run this:

```
yarn workspace wqtt run serve
```

## Testing with Mosquitto

With [mosquitto] in your `$PATH`, run it like this:

[mosquitto]: https://mosquitto.org/

```
yarn run mosquitto
```

It will be listening on port 1883 for MQTT connections and port 8080 for
WebSocket connections.

To publish a message with `mosquitto_pub`:

```
mosquitto_pub -h localhost -p 1883 -t topic/name -m payload -q 0
```
