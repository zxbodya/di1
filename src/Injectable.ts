import { Token } from './Token';
import { ServiceDeclaration } from './ServiceDeclaration';

export type Injectable<T> = Token<T> | ServiceDeclaration<T>;

/**
 * Helper type to allow extracting service type from token or declaration
 */
export type UnwrapInjectable<T extends Injectable<unknown>> =
  T extends Injectable<infer R> ? R : unknown;
