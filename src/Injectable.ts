import { Token } from './Token';
import { Declaration } from './Declaration';

export type Injectable<T> = Token<T> | Declaration<T>;

/**
 * Helper type to allow extacting service type from token or declaration
 */
export type UnwrapInjectable<T extends Injectable<unknown>> =
  T extends Injectable<infer R> ? R : unknown;
