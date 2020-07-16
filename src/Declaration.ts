import { Injectable } from './Injectable';

export type DependenciesArray = Array<Injectable<any>>;
export type FactoryWithDependenciesDepsArray<D extends DependenciesArray, S> = (
  ...args: UnwrapDependencies<D>
) => S;

export class Declaration<Service> {
  public name?: string;
  public factory: FactoryWithDependenciesDepsArray<any[], Service>;
  public deps: DependenciesArray;

  constructor(
    deps: DependenciesArray,
    factory: FactoryWithDependenciesDepsArray<any, Service>
  ) {
    this.deps = deps;
    this.factory = factory;
    this.name = factory.name;
  }
}

export type UnwrapDependencies<D> = {
  readonly [k in keyof D]: D[k] extends Injectable<infer R> ? R : never;
};

/**
 * Declare service implementation, specifying dependencies as arguments
 */
export function declareServiceRaw<S, D extends Array<Injectable<any>>>(
  factory: (...args: UnwrapDependencies<D>) => S,
  ...deps: D
): Declaration<S> {
  return new Declaration<S>(deps, factory);
}

export interface DependenciesObject {
  readonly [k: string]: Injectable<any>;
}

export type FactoryWithDependenciesObject<
  D extends DependenciesObject,
  S = any
> = (deps: UnwrapDependencies<D>) => S;

/**
 * Declare service implementation, specifying dependencies as an object
 */
export function declareService<S, D extends DependenciesObject>(
  deps: D,
  factory: FactoryWithDependenciesObject<D, S>
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
