import { Injectable } from './Injectable';

export default function tokenName(token: Injectable<any>): string {
  return token.name || 'unnamed';
}
