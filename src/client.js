// @flow

import log from './log';

type ClientOptions = {
  host: string,
  port: number,
};

export default class Client {
  options: ClientOptions;
  socket: ?WebSocket;

  constructor(options: ClientOptions) {
    this.options = options;
  }

  connect() {
    const { host, port } = this.options;

    const socket = new WebSocket(`ws://${host}:${port}`);

    socket.addEventListener('open', () => {
      log('connected');
    });

    this.socket = socket;
  }
}
