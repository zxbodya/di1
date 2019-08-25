import { Container } from './Container';
import { createToken } from './Token';
import { declareServiceRaw } from './Declaration';
import { containerToken } from './ContainerToken';

describe('DI Container', () => {
  let rootInjector: Container;

  const token10 = createToken<number>('10');
  const token11 = createToken<number>('11');
  const token21 = createToken<number>('21');

  const token1 = createToken<number>('1');
  const token2 = createToken<number>('2');
  const token3 = createToken<number>('3');

  beforeEach(() => {
    rootInjector = new Container();

    rootInjector.register(token10, declareServiceRaw(() => 10));
    rootInjector.register(token11, declareServiceRaw(ten => ten + 1, token10));
    rootInjector.register(
      token21,
      declareServiceRaw((ten, eleven) => ten + eleven, token10, token11)
    );
  });

  it('resolves simple dependencies', () => {
    rootInjector.register(token1, declareServiceRaw(() => 1));
    rootInjector.register(token2, declareServiceRaw(() => 2));
    rootInjector.register(
      token3,
      declareServiceRaw((one, two) => one + two, token1, token2)
    );

    expect(rootInjector.get(token3)).toBe(3);
  });

  it('throws for non existing token', () => {
    expect(() => rootInjector.get(token1)).toThrow(
      new Error('Provider for "1" not found')
    );
  });

  it('throws for cyclic dependencies', () => {
    rootInjector.register(token1, declareServiceRaw(() => 1, token2));
    rootInjector.register(token2, declareServiceRaw(() => 2, token1));
    expect(() => rootInjector.get(token1)).toThrow(
      new Error('Cyclic dependency: "1" depends on itself')
    );
  });

  it('caches instance after creation', () => {
    rootInjector.register(token1, declareServiceRaw(() => ({})));
    expect(rootInjector.get(token1)).toEqual(rootInjector.get(token1));
  });

  it('uses provider from parent container', () => {
    rootInjector.register(token1, declareServiceRaw(() => 1));
    const child = rootInjector.createChild();
    child.register(token2, declareServiceRaw(one => one + 1, token1));

    expect(child.get(token2)).toEqual(2);
  });

  it('child can override provider from parent', () => {
    rootInjector.register(token1, declareServiceRaw(() => 1));

    const child = rootInjector.createChild();
    child.register(token1, declareServiceRaw(() => 2));
    child.register(token3, declareServiceRaw(one => one + 1, token1));

    expect(child.get(token3)).toEqual(3);
  });

  it('reuses instances from parent container', () => {
    let cnt = 0;

    rootInjector.register(
      token1,
      declareServiceRaw(() => {
        cnt += 1;
        return {};
      })
    );

    const child = rootInjector.createChild();
    rootInjector.get(token1);
    child.get(token1);

    expect(cnt).toEqual(1);
  });

  it('do not reuse instances from parent container, if one of dependencies is overridden', () => {
    let cnt = 0;
    rootInjector.register(token3, declareServiceRaw(() => 3));
    rootInjector.register(
      token1,
      declareServiceRaw(() => {
        cnt += 1;
        return {};
      }, token3)
    );

    const child = rootInjector.createChild();
    rootInjector.get(token1);
    child.register(token3, declareServiceRaw(() => 4));
    child.get(token1);
    expect(cnt).toEqual(2);
  });

  it('should return itself when Injector instance is requested', () => {
    expect(rootInjector.get(containerToken())).toEqual(rootInjector);

    const child = rootInjector.createChild();
    expect(child.get(containerToken())).toEqual(child);

    const token = createToken('containerId');
    child.register(token, declareServiceRaw(id => id, containerToken()));
    expect(child.get(token)).toEqual(child);
  });

  it('should return correct when Injector instance to create specified dependencies', () => {
    const mockFactory = jest.fn(container => container);
    const svc = declareServiceRaw(mockFactory, containerToken(token10));
    rootInjector.register(svc);
    rootInjector.get(svc);
    expect(mockFactory.mock.calls.length).toEqual(1);
    expect(mockFactory.mock.calls[0]).toEqual([rootInjector]);

    const child1 = rootInjector.createChild();
    child1.get(svc);
    expect(mockFactory.mock.calls.length).toEqual(1);

    const child2 = rootInjector.createChild();
    child2.register(token10, declareServiceRaw(() => 0));
    child2.get(svc);
    expect(mockFactory.mock.calls.length).toEqual(2);
    expect(mockFactory.mock.calls[1]).toEqual([child2]);
  });

  it('get container directly', () => {
    expect(rootInjector.get(containerToken(token10, token11))).toEqual(
      rootInjector
    );
  });

  it('should allow to declare container dependency for creating specific services', () => {
    type SVC1 = () => SVC2;
    type SVC2 = { svc1: SVC1 };

    const svc2token = createToken<SVC2>('svc2');
    const svc1 = declareServiceRaw(container => {
      // todo: additional error when trying to call container from factory
      return () => container.get(svc2token);
    }, containerToken(svc2token));

    const svc2 = declareServiceRaw(svc1 => {
      return {
        svc1,
      };
    }, svc1);
    rootInjector.register(svc2token, svc2);

    const svc1Instance = rootInjector.get(svc1);
    const svc2instance = svc1Instance();
    expect(svc2instance.svc1).toEqual(svc1Instance);
  });

  it('allows to provider with dependency provided later in child container', () => {
    const tokenA = createToken('a');
    const tokenB = createToken('b');
    const tokenC = createToken('c');

    rootInjector.register(tokenA, declareServiceRaw(b => `a1=${b}`, tokenB));
    rootInjector.register(tokenB, declareServiceRaw(c => `b2=${c}`, tokenC));

    const child = rootInjector.createChild();
    child.register(tokenC, declareServiceRaw(() => 'c2'));
    expect(child.get(tokenA)).toEqual('a1=b2=c2');
  });

  it('allows to register declaration', () => {
    const d = declareServiceRaw(() => `a`);
    rootInjector.register(d);
  });

  it('allows to create service from unregistered declaration', () => {
    const d = declareServiceRaw(() => `a`);
    expect(rootInjector.get(d)).toBe('a');
  });

  it('when creating unregistered declaration it is registered at root container', () => {
    const d = declareServiceRaw(() => `a`);
    const child = rootInjector.createChild();
    expect(child.get(d)).toBe('a');
    // @ts-ignore checking private property
    expect(!!rootInjector.providers.get(d)).toEqual(true);
  });
});
