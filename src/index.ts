/**
 * Register default provider, will return passed token
 * @param {*} token
 * @param {function} factory
 * @param {*} deps
 * @returns {*}
 */
import { Factory, Token, defaultProviders, Injector } from './Injector';

export { Injector };
export function provide<T, F extends Factory<T> = Factory<T>>(
  token: Token<T>,
  factory: F,
  ...deps: Token[]
) {
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
export function annotate<F extends Factory = Factory>(
  factory: F,
  ...deps: Token[]
) {
  return provide(factory, factory, ...deps);
}
