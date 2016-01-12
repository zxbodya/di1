import tokenName from './tokenName.js';

describe('Token name utility', ()=> {
  it('returns function name when available', ()=> {
    function abc() {
    }

    expect(tokenName(abc)).toBe('abc');
  });

  it('returns "unnamed:function..." name when it is anonymous function', ()=> {
    expect(tokenName(function() {
    })).toMatch(/^unnamed:function/);
  });

  it('returns "unnamed:[object Array]" when array is used', ()=> {
    expect(tokenName([])).toBe('unnamed:[object Array]');
  });

  it('returns "unnamed:[object Constructor]" when object is used', ()=> {
    expect(tokenName({})).toBe('unnamed:[object Object]');
    function Abc() {
    }

    expect(tokenName(new Abc())).toMatch(/^unnamed:\[object \w+\]$/);
  });

  it('returns string if it is used as a token', ()=> {
    expect(tokenName('asd')).toBe('asd');
  });

  it('returns string representation of number if it is used as a token', ()=> {
    expect(tokenName(123)).toBe('123');
  });
});
