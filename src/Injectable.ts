import { Token } from './Token';
import { Declaration } from './Declaration';

export type Injectable<T> = Token<T> | Declaration<T>;
export type UnwrapInjectable<
  T extends Injectable<unknown>
> = T extends Injectable<infer R> ? R : never;
