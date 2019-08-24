import { Token } from './Token';

type DependenciesArray = Array<Injectable<any>>;
type FactoryArray<D extends DependenciesArray, S> = (...args: Unwrap<D>) => S;

export class Declaration<Service> {
  public factory: FactoryArray<any, Service>;
  public deps: DependenciesArray;

  constructor(deps: DependenciesArray, factory: FactoryArray<any, Service>) {
    this.deps = deps;
    this.factory = factory;
  }
}

export type Injectable<T> = Token<T> | Declaration<T>;

type Unwrap<D> = {
  readonly [k in keyof D]: D[k] extends Injectable<infer R> ? R : never;
};

export function declareServiceRaw<S, D extends Array<Injectable<any>>>(
  factory: (...args: Unwrap<D>) => S,
  ...deps: D
): Declaration<S> {
  return new Declaration<S>(deps, factory);
}

interface Dependencies {
  readonly [k: string]: Injectable<any>;
}

type Factory<D extends Dependencies, S = any> = (d: Unwrap<D>) => S;

export function declareService<S, D extends Dependencies>(
  d: D,
  f: Factory<D, S>
): Declaration<S> {
  const keys = Object.keys(d);
  const deps = keys.map(k => d[k]);
  const argsFactory: any = (...args: any[]) => {
    const depsObj: any = {};
    for (let i = 0, l = keys.length; i < l; i += 1) {
      depsObj[keys[i]] = args[i];
    }
    return f(depsObj);
  };
  return new Declaration<S>(deps, argsFactory);
}
