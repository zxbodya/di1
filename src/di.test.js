'use strict';
const di = require('../src/di');

di.provide(10, ()=>10);
di.provide(11, (ten)=>ten + 1, 10);
di.provide(21, (ten, eleven)=>ten + eleven, 10, 11);

describe('DI Container', function () {
  let injector;

  beforeEach(()=> {
    injector = new di.Injector();
  });

  it('resolves simple dependencies', ()=> {
    injector.provide(1, ()=>1);
    injector.provide(2, ()=>2);
    injector.provide(3, (one, two)=>one + two, 1, 2);

    expect(injector.require(3)).toBe(3);
  });

  it('throws for non existing token', ()=> {
    expect(()=>injector.require(1)).toThrow('provider not found');
  });

  it('throws for cyclomatic dependencies', ()=> {
    injector.provide(1, ()=>1, 2);
    injector.provide(2, ()=>2, 1);
    expect(()=>injector.require(1)).toThrow('cyclic dependency');
  });

  it('caches instance after creation', ()=> {
    injector.provide(1, ()=> {
      return {}
    });

    expect(injector.require(1)).toEqual(injector.require(1));
  });

  it('uses provide from parent injector', ()=> {
    injector.provide(1, ()=>1);

    let child = injector.branch();
    child.provide(2, (one)=>one + 1, 1);

    expect(child.require(2)).toEqual(2);
  });


  it('overrides provides from parent injector with provides from chils', ()=> {
    injector.provide(1, ()=>1);

    let child = injector.branch();
    child.provide(1, ()=>2);
    child.provide(3, (one)=>one + 1, 1);

    expect(child.require(3)).toEqual(3);
  });


  it('uses default provides', ()=> {
    expect(injector.require(10)).toBe(10);
    expect(injector.require(11)).toBe(11);
    expect(injector.require(21)).toBe(21);
  });


  it('do not reuse instances from parent injector', ()=> {
    let cnt = 0;

    injector.provide(1, ()=> {
      cnt += 1;
      return {}
    });

    let child = injector.branch();
    injector.require(1);
    child.require(1);

    expect(cnt).toEqual(2);
  });

});
