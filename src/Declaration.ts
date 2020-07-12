import { Injectable } from './Injectable';

type DependenciesArray = Array<Injectable<any>>;
type FactoryArray<D extends DependenciesArray, S> = (...args: Unwrap<D>) => S;

export class Declaration<Service> {
  public name?: string;
  public factory: FactoryArray<any[], Service>;
  public deps: DependenciesArray;

  constructor(deps: DependenciesArray, factory: FactoryArray<any, Service>) {
    this.deps = deps;
    this.factory = factory;
    this.name = factory.name;
  }
}

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

type Factory<D extends Dependencies, S = any> = (deps: Unwrap<D>) => S;

export function declareService<S, D extends Dependencies>(
  deps: D,
  factory: Factory<D, S>
): Declaration<S> {
  const keys = Object.keys(deps);
  const depsArray = keys.map((k) => deps[k]);
  const argsFactory: any = (...args: any[]) => {
    const depsObj: any = {};
    for (let i = 0, l = keys.length; i < l; i += 1) {
      depsObj[keys[i]] = args[i];
    }
    return factory(depsObj);
  };
  return new Declaration<S>(depsArray, argsFactory);
}
