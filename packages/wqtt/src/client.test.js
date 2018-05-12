// @flow

/* eslint-env jest */

import Client from './client';

describe('Client', () => {
  test('can be constructed', () => {
    expect(new Client({ host: '', port: 0 })).toBeDefined();
  });
});
