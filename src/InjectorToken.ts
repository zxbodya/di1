import { Injectable } from './Injectable';
import { Token } from './Token';
import { Injector } from './Injector';

export class InjectorToken extends Token<Injector> {
  public readonly deps: Injectable<any>[];
  constructor(tokens: Injectable<any>[]) {
    // todo: additional debug info
    super('Injector()');
    this.deps = tokens;
  }
}

export function injectorToken(...tokens: Injectable<any>[]): InjectorToken {
  return new InjectorToken(tokens);
}
