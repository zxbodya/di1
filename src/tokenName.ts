import { Injectable } from './Injectable';

/**
 * Helper utility used internally to get token name to be used for debug purposes
 * @param token
 */
export default function tokenName(token: Injectable<any>): string {
  return token.name || 'unnamed';
}
