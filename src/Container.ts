/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion */
import tokenName from './tokenName';
import { Declaration } from './Declaration';
import { Injectable } from './Injectable';
import { ContainerToken } from './ContainerToken';

export interface ContainerInterface {
  register<T>(declaration: Declaration<T>): void;
  register<T>(token: Injectable<T>, declaration: Declaration<T>): void;
  get<T>(token: Injectable<T>): T;
  createChild(): ContainerInterface;
}

export class Container implements ContainerInterface {
  private readonly parent?: Container;
  private readonly providers = new Map<Injectable<any>, Declaration<any>>();
  private readonly cache = new Map<Injectable<any>, any>();
  constructor(parent?: Container) {
    this.parent = parent;
  }

  /**
   * Register service, can replace existing override one from parent container
   */
  register<T>(declaration: Declaration<T>): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T>(token: Injectable<T>, declaration: Declaration<T>): void;
  // eslint-disable-next-line no-dupe-class-members
  register<T>(token: Injectable<T>, declaration?: Declaration<T>): void {
    if (declaration) {
      this.providers.set(token, declaration);
    } else {
      this.providers.set(token, token as Declaration<T>);
    }
  }

  /**
   * Resolve service declaration
   */
  private resolve<T>(token: Injectable<T>): Declaration<T> {
    return (
      this.providers.get(token)! || (this.parent && this.parent.resolve(token))
    );
  }

  /**
   * Find all dependencies for specified token, can contain duplicates
   */
  private deps(
    token: Injectable<any>,
    chain: Array<Injectable<any>>,
    startContainer: Container = this,
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
      if (token instanceof Declaration) {
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
      if (token instanceof ContainerToken) {
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

  /**
   * Get service instance
   */
  get<T>(token: Injectable<T>): T {
    if (token instanceof ContainerToken) {
      return (this as unknown) as T;
    }

    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    this.ensureRegistered(token);

    let shouldInstantiate = false;
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
      const { factory, deps } = this.resolve(token);
      const args: any = new Array(deps.length);
      for (let i = 0, l = deps.length; i < l; i += 1) {
        args[i] = this.get(deps[i]);
      }
      // when creating service with dependency on Container, it is possible that it would be used during creation
      // effectively causing infinite recursion
      // this code is to prevent this from happening
      const containerIndices = [];
      for (let i = 0, l = args.length; i < l; i += 1) {
        const arg = args[i];
        if (arg instanceof Container) {
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

  private ensureRegistered(token: Injectable<any>) {
    if (token instanceof Declaration) {
      let container: Container = this;
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

  /**
   * Create child container using this as parent
   */
  createChild() {
    return new Container(this);
  }
}
