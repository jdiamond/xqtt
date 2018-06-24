// @flow

/* eslint-env jest */

import Client from './client';

describe('Client', () => {
  test('can be constructed', () => {
    expect(new Client()).toBeDefined();
  });
});
