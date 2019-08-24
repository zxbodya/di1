import { Injector } from './Injector';

describe('DI Container', () => {
  let rootInjector: Injector;

  beforeEach(() => {
    rootInjector = new Injector();
    rootInjector.register(10, () => 10);
    rootInjector.register(11, ten => ten + 1, 10);
    rootInjector.register(21, (ten, eleven) => ten + eleven, 10, 11);
  });

  it('resolves simple dependencies', () => {
    rootInjector.register(1, () => 1);
    rootInjector.register(2, () => 2);
    rootInjector.register(3, (one, two) => one + two, 1, 2);

    expect(rootInjector.get(3)).toBe(3);
  });

  it('throws for non existing token', () => {
    expect(() => rootInjector.get(1)).toThrow(
      new Error('Provider for "1" not found')
    );
    expect(() => rootInjector.get(123)).toThrow(
      new Error('Provider for "123" not found')
    );
  });

  it('throws for cyclic dependencies', () => {
    rootInjector.register(1, () => 1, 2);
    rootInjector.register(2, () => 2, 1);
    expect(() => rootInjector.get(1)).toThrow(
      new Error('Cyclic dependency: "1" depends on itself')
    );
  });

  it('caches instance after creation', () => {
    rootInjector.register(1, () => ({}));

    expect(rootInjector.get(1)).toEqual(rootInjector.get(1));
  });

  it('uses provider from parent injector', () => {
    rootInjector.register(1, () => 1);

    const child = rootInjector.createChild();
    child.register(2, one => one + 1, 1);

    expect(child.get(2)).toEqual(2);
  });

  it('child can override provider from parent', () => {
    rootInjector.register(1, () => 1);

    const child = rootInjector.createChild();
    child.register(1, () => 2);
    child.register(3, one => one + 1, 1);

    expect(child.get(3)).toEqual(3);
  });

  it('reuses instances from parent injector', () => {
    let cnt = 0;

    rootInjector.register(1, () => {
      cnt += 1;
      return {};
    });

    const child = rootInjector.createChild();
    rootInjector.get(1);
    child.get(1);

    expect(cnt).toEqual(1);
  });

  it('do not reuse instances from parent injector, if one of dependencies is overridden', () => {
    let cnt = 0;
    rootInjector.register(3, () => 3);
    rootInjector.register(
      1,
      () => {
        cnt += 1;
        return {};
      },
      3
    );

    const child = rootInjector.createChild();
    rootInjector.get(1);
    child.register(3, () => 4);
    child.get(1);
    expect(cnt).toEqual(2);
  });

  it('should return itself when Injector instance is requested', () => {
    expect(rootInjector.get(Injector)).toEqual(rootInjector);
    const child = rootInjector.createChild();
    expect(child.get(Injector)).toEqual(child);
    child.register('injectorId', id => id, Injector);
    expect(child.get('injectorId')).toEqual(child);
  });

  it('should use "latest" injector when instantiating with injector dependency', () => {
    rootInjector.register('injectorId', id => id, Injector);
    const child = rootInjector.createChild();
    expect(child.get('injectorId')).toEqual(child);
  });

  it('allows to provider with dependency provided later in child injector', () => {
    rootInjector.register('a', b => `a1=${b}`, 'b');
    rootInjector.register('b', c => `b2=${c}`, 'c');

    const child = rootInjector.createChild();
    child.register('c', () => 'c2');
    expect(child.get('a')).toEqual('a1=b2=c2');
  });
});
