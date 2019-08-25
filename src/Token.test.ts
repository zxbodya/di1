import { createToken } from './Token';

test('createToken', () => {
  createToken();
  createToken('test');
  createToken<string>('test');
});
