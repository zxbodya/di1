/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion */
import tokenName from './tokenName';
import { ServiceDeclaration } from './ServiceDeclaration';
import { Injectable } from './Injectable';
import { InjectorToken } from './InjectorToken';

export interface InjectorInterface {
  /**
   * Register service, can replace existing override one from parent container
   */
  register<T, R extends T>(declaration: ServiceDeclaration<R>): void;

  /**
   * Register service declaration for given token
   */
  register<T, R extends T>(
    token: Injectable<T>,
    declaration: ServiceDeclaration<R>
  ): void;

  /**
   * Get service instance. Creating new one or using previously created instance.
   */
  get<T>(token: Injectable<T>): T;

  /**
   * Create child container using this as a parent
   */
  createChild(): InjectorInterface;
}

export class Injector implements InjectorInterface {
  private readonly parent?: Injector;
  private readonly providers = new Map<
    Injectable<any>,
    ServiceDeclaration<any>
  >();
  private readonly cache = new Map<Injectable<any>, any>();
  constructor(parent?: Injector) {
    this.parent = parent;
  }

  register<T>(declaration: ServiceDeclaration<T>): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T, R extends T>(
    token: Injectable<T>,
    declaration: ServiceDeclaration<R>
  ): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T, R extends T>(
    token: Injectable<T>,
    declaration?: ServiceDeclaration<R>
  ): void {
    if (declaration) {
      this.providers.set(token, declaration);
    } else {
      this.providers.set(token, token as ServiceDeclaration<T>);
    }
  }

  /**
   * Resolve service declaration
   */
  private resolve<T>(token: Injectable<T>): ServiceDeclaration<T> | undefined {
    return (
      this.providers.get(token) || (this.parent && this.parent.resolve(token))
    );
  }

  /**
   * Find all dependencies for specified token, can contain duplicates
   */
  private deps(
    token: Injectable<any>,
    chain: Array<Injectable<any>>,
    startContainer: Injector = this,
    excludes: Set<Injectable<any>> = new Set()
  ): Injectable<any>[] {
    if (token === chain[0]) {
      throw new Error(
        `Cyclic dependency: "${chain
          .map((t) => tokenName(t))
          .join('->')}->${tokenName(token)}"`
      );
    }

    let directDeps;
    const declaration = this.providers.get(token);
    if (declaration) {
      directDeps = declaration!.deps;
    } else {
      if (token instanceof ServiceDeclaration) {
        this.ensureRegistered(token);
        directDeps = token.deps;
      }
    }

    function computeDeps(
      deps: Injectable<any>[],
      excludes: Set<Injectable<any>>,
      chain: Array<Injectable<any>>
    ) {
      const result = [];
      for (let i = 0, l = deps.length; i < l; i += 1) {
        const dep = deps[i];
        if (!excludes.has(dep)) {
          result.push(dep);
          result.push(
            ...startContainer.deps(dep, chain, startContainer, excludes)
          );
        }
      }
      return result;
    }

    if (directDeps) {
      return computeDeps(directDeps, excludes, chain.concat(token));
    } else {
      if (token instanceof InjectorToken) {
        return computeDeps(
          token.deps,
          new Set<Injectable<any>>([chain[chain.length - 1], ...excludes]),
          []
        );
      }
    }

    if (this.parent) {
      return this.parent.deps(token, chain, startContainer);
    }
    throw new Error(`Provider for "${tokenName(token)}" not found`);
  }

  get<T>(token: Injectable<T>): T {
    if (token instanceof InjectorToken) {
      return this as unknown as T;
    }

    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    this.ensureRegistered(token);

    let shouldInstantiate;
    const deps = new Set(this.deps(token, []));

    if (this.providers.has(token) || !this.parent) {
      shouldInstantiate = true;
    } else
      shouldInstantiate =
        // first container and no dependencies
        (deps.size === 0 && !this.parent) ||
        // some of dependencies are overridden
        !![...this.providers.keys()].find((t) => deps.has(t));

    if (shouldInstantiate) {
      // resolve would return non null value, because of ensureRegistered call earlier
      const { factory, deps } = this.resolve(token)!;
      const args: any[] = new Array(deps.length);
      for (let i = 0, l = deps.length; i < l; i += 1) {
        args[i] = this.get(deps[i]);
      }
      // when creating service with dependency on Container, it is possible that it would be used during creation
      // effectively causing infinite recursion
      // this code is to prevent this from happening
      const containerIndices = [];
      for (let i = 0, l = args.length; i < l; i += 1) {
        const arg = args[i];
        if (arg instanceof Injector) {
          containerIndices.push(i);
          arg.get = () => {
            throw new Error(
              'Using container.get() from factory function is not allowed.'
            );
          };
          arg.register = () => {
            throw new Error(
              'Using container.register() from factory function is not allowed.'
            );
          };
        }
      }
      const instance = factory(...args);
      // removing debug code added above
      for (let i = 0, l = containerIndices.length; i < l; i += 1) {
        const arg = args[containerIndices[i]];
        delete arg.get;
        delete arg.register;
      }
      this.cache.set(token, instance);
      return instance as T;
    }
    return this.parent!.get(token);
  }

  /**
   * Check if declaration is already registered, and if not - register it
   * @param token
   */
  private ensureRegistered(token: Injectable<any>) {
    if (token instanceof ServiceDeclaration) {
      let container: Injector = this;
      let isRegistered = container.providers.has(token);
      // try to find container which have provider for specified declaration
      while (container.parent && !isRegistered) {
        isRegistered = container.providers.has(token);
        container = container.parent;
      }
      // if not found register it in root container
      if (!isRegistered) {
        container.register(token);
      }
    }
  }

  createChild(): InjectorInterface {
    return new Injector(this);
  }
}
