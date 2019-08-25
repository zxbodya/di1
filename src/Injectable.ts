import { Token } from './Token';
import { Declaration } from './Declaration';

export type Injectable<T> = Token<T> | Declaration<T>;
