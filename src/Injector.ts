/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion */
import tokenName from './tokenName';

type Token<T = any> = any;
type Factory<T = any> = (...args: any) => T;
type Provider<T = any> = [Factory<T>, Token[]];

/**
 * Injector class
 * @class
 */
export class Injector {
  private readonly parent?: Injector;
  private readonly providers = new Map<any, Provider>();
  private readonly cache = new Map<any, any>();
  /**
   * @param {Injector} injector Parent injector
   */
  constructor(injector?: Injector) {
    this.parent = injector;
  }

  /**
   * Register provider, can replace existing override one from parent injector
   * @param {*} token Token to be used as provider id
   * @param {function} factory Factory function used to create instance
   * @param {*} deps Tokens identifying services to be injected into factory
   * @returns {*}
   */
  register<T, F extends Factory<T> = Factory<T>>(
    token: Token<T>,
    factory: F,
    ...deps: Token[]
  ) {
    this.providers.set(token, [factory, deps]);
    return token;
  }

  /**
   * Resolve provider for service
   * @param {*} token Token identifying required service
   * @returns {Injector|function}
   */
  private resolve<T>(token: Token<T>): Provider<T> {
    if (token === Injector) return [() => (this as unknown) as T, []];
    return (
      this.providers.get(token)! || (this.parent && this.parent.resolve(token))
    );
  }

  /**
   * Find all dependencies for specified token, can contain duplicates
   * @param {*} token
   * @param {*} fromToken
   * @param {Injector} startInjector
   * @returns {Array}
   */
  private deps(
    token: Token,
    fromToken?: Token,
    startInjector: Injector = this
  ): Token[] {
    if (token === Injector) return [];
    if (token === fromToken) {
      throw new Error(
        `Cyclic dependency: "${tokenName(token)}" depends on itself`
      );
    }

    let directDeps;
    if (this.providers.has(token)) {
      directDeps = this.providers.get(token)![1];
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
   * Check does service instance should be instantiated using this Injector(instead of parent one)
   * @private
   * @param {*} token
   * @returns {*}
   */
  private shouldInstantiate(token: Token) {
    const deps = new Set(this.deps(token));

    if (this.providers.has(token) || !this.parent || token === Injector) {
      return true;
    }

    return (
      // first injector and no dependencies
      (deps.size === 0 && !this.parent) ||
      // Instance of current injector is required
      deps.has(Injector) ||
      // some of dependencies are overridden
      [...this.providers.keys()].filter(t => deps.has(t)).length > 0
    );
  }

  /**
   * Get service instance
   * @param {*} token
   * @returns {*}
   */
  get<T>(token: Token<T>): T {
    if (token === Injector) {
      return (this as unknown) as T;
    }

    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    if (this.shouldInstantiate(token)) {
      const [factory, deps] = this.resolve(token);
      const args = new Array(deps.length);
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
