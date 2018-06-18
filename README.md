Build all projects like this:

```
yarn run build
```

While developing, automatically build on change with commands like this:

```
yarn workspace xqtt run babel:watch
yarn workspace nqtt run babel:watch
yarn workspace wqtt run babel:watch
```

To run unit tests:

```
yarn workspace xqtt run jest:watch
```

Serve the wqtt test HTML like this:

```
yarn workspace wqtt run serve
```

Your browser should open to http://localhost:8888.

Start mosquitto like this:

```
yarn run mosquitto
```

It assumes `mosquitto` is installed and in your `$PATH`.

It will be listening on port 1883 for MQTT connections and port 8080 for
WebSocket connections.

To publish a message with `mosquitto_pub`:

```
mosquitto_pub -h localhost -p 1883 -t topic/name -m payload -q 0
```
