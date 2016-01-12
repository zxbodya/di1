import tokenName from './tokenName';

const defaultProviders = new Map();

/**
 * Injector class
 * @class
 */
class Injector {
  /**
   * @param {Injector} injector Parent injector
   * @param {Map} providers Map instance containing providers declaration to be used by injector
   * @param {Map} cache Map instance used to cache created instances
   */
  constructor(injector = null, providers = new Map(), cache = new Map()) {
    this.providers = providers;
    this.cache = cache;
    this.parent = injector;
  }

  /**
   * Declare new provider, shadow or replce existing
   * @param {*} token Token to be used as provider id
   * @param {function} factory Factory function used to create instance
   * @param {*} deps Tokens identifying services to be injected into factory
   * @returns {*}
   */
  provide(token, factory, ...deps) {
    this.providers.set(token, [factory, deps]);
    return token;
  }

  /**
   * Resolve provider for service
   * @param {*} token Token identifying required service
   * @returns {Injector|function}
   */
  resolve(token) {
    return this.providers.get(token)
      || (this.parent && this.parent.resolve(token))
      || defaultProviders.get(token);
  }

  /**
   * Find all dependencies for specified token, can contain duplicates
   * @param {*} token
   * @param {*} fromToken
   * @param {Injector} startInjector
   * @returns {Array}
   */
  deps(token, fromToken, startInjector = this) {
    if (token === fromToken) {
      throw new Error(`Cyclic dependency: "${tokenName(token)}" depends on itself`);
    }

    let directDeps;
    if (this.providers.has(token)) {
      directDeps = this.providers.get(token)[1];
    } else {
      if (!this.parent && defaultProviders.has(token)) {
        directDeps = defaultProviders.get(token)[1];
      }
    }

    if (directDeps) {
      const result = [];
      for (let i = 0, l = directDeps.length; i < l; i++) {
        const dep = directDeps[i];
        result.push(dep);
        result.push.apply(result, startInjector.deps(dep, fromToken || token));
      }
      return result;
    }

    if (this.parent) {
      return this.parent.deps(token, fromToken, startInjector);
    }
    throw new Error(`Provider for "${tokenName(token)}" not found`);
  }

  /**
   * Check does service instance should be instantiated using this Injector(istead of parent one)
   * @private
   * @param {*} token
   * @returns {*}
   */
  shouldInstantiate(token) {
    const deps = new Set(this.deps(token));

    if (this.providers.has(token) || (!this.parent && defaultProviders.has(token))) {
      return true;
    }

    return (
      // first injector and no dependencies
      (deps.size === 0 && !this.parent)
        // Instance of current inector is required
      || deps.has(Injector)
        // some of dependencies is overridden
      || [...this.providers.keys()].filter(t=>deps.has(t)).length > 0
    );
  }

  /**
   * Get service instance
   * @param {*} token
   * @returns {*}
   */
  get(token) {
    if (token === Injector) {
      return this;
    }

    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    if (this.shouldInstantiate(token)) {
      const [factory, deps] = this.resolve(token);
      const args = new Array(deps.length);
      for (let i = 0, l = deps.length; i < l; i++) {
        args[i] = this.get(deps[i]);
      }
      const instance = factory(...args);
      this.cache.set(token, instance);
      return instance;
    }
    return this.parent.get(token);
  }

  /**
   * Create child injectot using this as parent
   * @returns {Injector}
   */
  createChild() {
    return new Injector(this);
  }
}

defaultProviders.set(Injector, [()=> {
}, []]);

/**
 * Register default provider, will return passed token
 * @param {*} token
 * @param {function} factory
 * @param {*} deps
 * @returns {*}
 */
function provide(token, factory, ...deps) {
  defaultProviders.set(token, [factory, deps]);
  return token;
}

/**
 * Shortcut to provide when factory and token are the same.
 * Return passed factory
 * @param {function} factory
 * @param {*} deps
 * @returns {function}
 */
function annotate(factory, ...deps) {
  return provide(factory, factory, ...deps);
}

export default {
  annotate,
  provide,
  Injector,
};
