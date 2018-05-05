// @flow

/* eslint-env jest */

import Parser from './parser';

describe('Parser', () => {
  test('can be constructed', () => {
    expect(new Parser()).toBeDefined();
  });
});
