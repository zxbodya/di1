import { Injectable } from './Injectable';
import { Token } from './Token';
import { ContainerInterface } from './Container';
import tokenName from './tokenName';

export class ContainerToken extends Token<ContainerInterface> {
  public readonly deps: Injectable<any>[];
  constructor(tokens: Injectable<any>[]) {
    super(`Injector(${tokens.map(t => tokenName(t)).join(',')})`);
    this.deps = tokens;
  }
}

export function containerToken(
  ...tokens: Injectable<any>[]
): Token<ContainerInterface> {
  return new ContainerToken(tokens);
}
