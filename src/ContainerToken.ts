import { Injectable } from './Injectable';
import { Token } from './Token';
import { ContainerInterface } from './Container';
import tokenName from './tokenName';

export class ContainerToken extends Token<ContainerInterface> {
  public readonly deps: Injectable<any>[];
  constructor(tokens: Injectable<any>[]) {
    super(`Container(${tokens.map((t) => tokenName(t)).join(',')})`);
    this.deps = tokens;
  }
}

/**
 * Create special token to allow container to be injected.
 *
 * optionally has a list of dependencies which should be available for the container,
 * this affects in which specific container in the hierarchy service using it is to be created.
 */
export function containerToken(
  ...tokens: Injectable<any>[]
): Token<ContainerInterface> {
  return new ContainerToken(tokens);
}
