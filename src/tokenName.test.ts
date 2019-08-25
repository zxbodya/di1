import tokenName from './tokenName';

describe('Token name utility', () => {
  it('return name property of object if present', () => {
    expect(tokenName({ name: '123' })).toBe('123');
    expect(tokenName({ name: undefined })).toBe('unnamed');
  });
});
