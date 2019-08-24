import { createToken } from './Token';

test('createToken', () => {
  createToken('test');
  createToken<string>('test');
});
