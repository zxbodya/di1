/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion */
import tokenName from './tokenName';
import { createToken } from './Token';
import { Declaration, Injectable } from './Declaration';

export const InjectorToken = createToken<Injector>('Injector');

interface InjectorInterface {
  register<T>(service: Declaration<T>): void;
  register<T>(token: Injectable<T>, service: Declaration<T>): void;
  get<T>(service: Injectable<T>): T;
}

/**
 * Injector class
 */
export class Injector implements InjectorInterface {
  private readonly parent?: Injector;
  private readonly providers = new Map<Injectable<any>, Declaration<any>>();
  private readonly cache = new Map<Injectable<any>, any>();
  constructor(injector?: Injector) {
    this.parent = injector;
  }

  /**
   * Register service, can replace existing override one from parent injector
   */
  register<T>(service: Declaration<T>): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T>(token: Injectable<T>, service: Declaration<T>): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T>(token: Injectable<T>, service?: Declaration<T>): void {
    if (service) {
      this.providers.set(token, service);
    } else {
      this.providers.set(token, token as Declaration<T>);
    }
  }

  /**
   * Resolve service declaration
   */
  private resolve<T>(token: Injectable<T>): Declaration<T> {
    // todo: getting not last injector
    // if (token === InjectorToken)
    //   return new Declaration([], () => (this as unknown) as T);
    return (
      this.providers.get(token)! || (this.parent && this.parent.resolve(token))
    );
  }

  /**
   * Find all dependencies for specified token, can contain duplicates
   */
  private deps(
    token: Injectable<any>,
    fromToken?: Injectable<any>,
    startInjector: Injector = this
  ): Injectable<any>[] {
    if (token === InjectorToken) return [];
    if (token === fromToken) {
      throw new Error(
        `Cyclic dependency: "${tokenName(token)}" depends on itself`
      );
    }

    let directDeps;
    if (this.providers.has(token)) {
      directDeps = this.providers.get(token)!.deps;
    }

    if (directDeps) {
      const result = [];
      for (let i = 0, l = directDeps.length; i < l; i += 1) {
        const dep = directDeps[i];
        result.push(dep);
        result.push(...startInjector.deps(dep, fromToken || token));
      }
      return result;
    }

    if (this.parent) {
      return this.parent.deps(token, fromToken, startInjector);
    }
    throw new Error(`Provider for "${tokenName(token)}" not found`);
  }

  /**
   * Get service instance
   */
  get<T>(token: Injectable<T>): T {
    if (token === InjectorToken) {
      return (this as unknown) as T;
    }

    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    if (token instanceof Declaration) {
      let injector: Injector = this;
      let isRegistered = injector.providers.has(token);
      // try to find injector which have provider for specified declaration
      while (injector.parent && !isRegistered) {
        isRegistered = injector.providers.has(token);
        injector = injector.parent;
      }
      // if not found register it in root injector
      if (!isRegistered) {
        injector.register(token);
      }
    }

    let shouldInstantiate = false;
    const deps = new Set(this.deps(token));

    if (this.providers.has(token) || !this.parent || token === InjectorToken) {
      shouldInstantiate = true;
    } else
      shouldInstantiate =
        // first injector and no dependencies
        (deps.size === 0 && !this.parent) ||
        // Instance of current injector is required
        deps.has(InjectorToken) ||
        // some of dependencies are overridden
        !![...this.providers.keys()].find(t => deps.has(t));

    if (shouldInstantiate) {
      const { factory, deps } = this.resolve(token);
      const args: any = new Array(deps.length);
      for (let i = 0, l = deps.length; i < l; i += 1) {
        args[i] = this.get(deps[i]);
      }
      const instance = factory(...args);
      this.cache.set(token, instance);
      return instance as T;
    }
    return this.parent!.get(token);
  }

  /**
   * Create child injector using this as parent
   */
  createChild() {
    return new Injector(this);
  }
}
