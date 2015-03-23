"use strict";

const defaultProviders = new Map();

class Injector {
  constructor(injector, providers = new Map(defaultProviders), cache = new Map()) {
    this._providers = providers;
    this._cache = cache;
    this._parent = injector;
  }

  provide(token, factory, ...deps) {
    this._providers.set(token, [factory, deps])
  }


  resolve(token) {
    return this._providers.get(token)
      || (this._parent && this._parent.resolve(token));
  }

  require(token, fromToken = null) {
    if (this._cache.has(token)) {
      return this._cache.get(token)
    }
    // todo: reuse parent instances
    // if (!this._providers.has(token)) {
    //   if (this._parent) {
    //     return this._parent.require(token);
    //   }
    // }

    if (token === fromToken) {
      throw 'cyclic dependency';
    }

    let provider = this.resolve(token);

    if (provider) {
      let [factory, deps] = provider;
      let args = [];
      for (let i = 0, l = deps.length; i < l; i++) {
        args.push(this.require(deps[i], fromToken || token));
      }
      let instance = factory(...args);
      this._cache.set(token, instance);
      return instance;
    } else {
      throw 'provider not found';
    }
  }

  branch() {
    return new Injector(this);
  }
}


var di = {
  provide(token, factory, ...deps) {
    defaultProviders.set(token, [factory, deps])
  },
  Injector
};

module.exports = di;
