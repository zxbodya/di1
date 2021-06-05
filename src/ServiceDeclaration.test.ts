import { createToken } from './Token';
import { declareService, declareServiceRaw } from './ServiceDeclaration';

test('declareService', () => {
  const o = declareService({}, () => ({ a: 1 }));
  const n = createToken<number>();
  const s = createToken<string>();

  declareService({ n, s, o }, (d) => {
    d.n.toExponential();
    d.o.a = 1;
    return 1;
  });
});

test('declareService - factory is called with correct arguments', () => {
  const a = createToken<number>();
  const b = createToken<number>();
  const c = createToken<number>();

  const factoryMock = jest.fn(() => 1);
  const svc = declareService({ a, b, c }, factoryMock);

  expect(svc.deps).toEqual([a, b, c]);
  expect(svc.factory(1, 2, 3)).toEqual(1);
  expect(factoryMock.mock.calls.length).toBe(1);
  expect(factoryMock.mock.calls[0]).toEqual([{ a: 1, b: 2, c: 3 }]);
});

test('declareServiceArray', () => {
  const n = createToken<number>();
  const s = createToken<string>();
  const o = declareServiceRaw(() => ({ a: 1 }));

  declareServiceRaw(
    (n, s, o) => {
      n.toExponential();
      o.a = 1;
      return 1;
    },
    n,
    s,
    o
  );
});
