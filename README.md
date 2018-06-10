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

It will be listening on port 8080 for WebSocket connections.
