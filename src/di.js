"use strict";

const defaultProviders = new Map();

class Injector {
  constructor(injector, providers = new Map(), cache = new Map()) {
    this._providers = providers;
    this._cache = cache;
    this._parent = injector;
  }

  provide(token, factory, ...deps) {
    this._providers.set(token, [factory, deps])
  }


  resolve(token) {
    return this._providers.get(token)
      || (this._parent && this._parent.resolve(token))
      || defaultProviders.get(token);
  }

  deps(token, fromToken = null) {
    if (token === fromToken) {
      throw 'cyclic dependency';
    }

    let firstDeps;
    const deps = [];
    if (this._providers.has(token)) {
      firstDeps = this._providers.get(token)[1];
    } else {
      if (!this._parent && defaultProviders.has(token)) {
        firstDeps = defaultProviders.get(token)[1];
      }
    }
    if (firstDeps) {
      firstDeps.forEach(dep=> {
        deps.push(dep);
        deps.push.apply(deps, this.deps(dep, fromToken || token));
      });
      return deps;
    }

    if (this._parent) {
      return this._parent.deps(token, fromToken);
    } else {
      throw 'provider not found';
    }
  }

  _shouldInstantiate(token) {
    const deps = new Set(this.deps(token));

    if (this._providers.has(token) || (!this._parent && defaultProviders.has(token))) {
      return true;
    }

    // if some of dependencies is overridden by local provider
    const keys = [...this._providers.keys()];
    const keysFromDeps = keys.filter(token=>deps.has(token));
    return keysFromDeps.length > 0 || (deps.size === 0 && !this._parent);
  }

  get(token) {
    if (this._cache.has(token)) {
      return this._cache.get(token)
    }

    if (this._shouldInstantiate(token)) {
      let [factory, deps] = this.resolve(token);
      let args = [];
      for (let i = 0, l = deps.length; i < l; i++) {
        args.push(this.get(deps[i]));
      }
      let instance = factory(...args);
      this._cache.set(token, instance);
      return instance;
    } else {
      return this._parent.get(token);
    }
  }

  createChild() {
    return new Injector(this);
  }
}

module.exports = {
  provide(token, factory, ...deps) {
    defaultProviders.set(token, [factory, deps])
  },
  Injector
};
